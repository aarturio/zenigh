import { TABLE_MAP } from "../config.js";
import db from "./connection.js";

class DatabaseOperations {
  // Initialize database schema
  static async initializeSchema() {
    try {
      // Enable UUID extension
      await db.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

      // Create users table
      await db.raw(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Create users table index
      await db.raw(`CREATE INDEX IF NOT EXISTS ix_users_email ON users(email)`);

      // Create market data tables
      for (const tableName of Object.values(TABLE_MAP)) {
        await db.raw(`
          CREATE TABLE IF NOT EXISTS ${tableName} (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            symbol VARCHAR NOT NULL,
            timestamp TIMESTAMPTZ NOT NULL,
            open DOUBLE PRECISION NOT NULL,
            high DOUBLE PRECISION NOT NULL,
            low DOUBLE PRECISION NOT NULL,
            close DOUBLE PRECISION NOT NULL,
            volume BIGINT NOT NULL,
            trade_count INTEGER,
            vwap NUMERIC(18,8)
          )
        `);

        // Create indexes
        await db.raw(
          `CREATE INDEX IF NOT EXISTS ix_${tableName}_symbol ON ${tableName}(symbol)`
        );
        await db.raw(
          `CREATE INDEX IF NOT EXISTS ix_${tableName}_timestamp ON ${tableName}(timestamp)`
        );
        await db.raw(
          `CREATE UNIQUE INDEX IF NOT EXISTS ix_${tableName}_symbol_timestamp ON ${tableName}(symbol, timestamp)`
        );
      }

      console.log("Database schema initialized successfully");
    } catch (error) {
      console.error("Schema initialization failed:", error);
      throw error;
    }
  }

  // Bulk insert market data with batching (handles large datasets)
  static async bulkInsertMarketData(dataArray, tableName) {
    const BATCH_SIZE = 5000;
    let totalInserted = 0;

    await db.transaction(async (trx) => {
      // Process data in batches
      for (let i = 0; i < dataArray.length; i += BATCH_SIZE) {
        const batch = dataArray.slice(i, i + BATCH_SIZE);

        await trx(tableName)
          .insert(batch)
          .onConflict(["symbol", "timestamp"])
          .ignore();

        totalInserted += batch.length;
        console.log(
          `Inserted batch: ${batch.length} records (${totalInserted}/${dataArray.length} total)`
        );
      }
    });

    console.log(
      `Bulk inserted ${totalInserted} records in ${Math.ceil(
        dataArray.length / BATCH_SIZE
      )} batches`
    );
  }

  // Get market data by symbol and date range
  static async getMarketData(symbol, tableName) {
    return await db(tableName).where({ symbol }).orderBy("timestamp", "asc");
  }

  /**
   * Get recent bars for indicator calculations
   * @param {string} symbol - Stock symbol
   * @param {string} timeframe - Timeframe (1T, 5T, 1H, 1D)
   * @param {number} limit - Number of bars to fetch (default: 200)
   * @returns {Promise<Array>} Array of OHLCV bars in chronological order
   */
  static async getRecentBars(symbol, timeframe, limit = 200) {
    const tableName = TABLE_MAP[timeframe];

    if (!tableName) {
      throw new Error(`Invalid timeframe: ${timeframe}. Valid options: ${Object.keys(TABLE_MAP).join(', ')}`);
    }

    // Fetch recent bars in reverse order, then reverse to get chronological
    const rows = await db(tableName)
      .where({ symbol })
      .orderBy("timestamp", "desc")
      .limit(limit);

    // Return in chronological order (oldest to newest)
    return rows.reverse();
  }

  /**
   * Get recent bars formatted for indicators
   * @param {string} symbol - Stock symbol
   * @param {string} timeframe - Timeframe (1T, 5T, 1H, 1D)
   * @param {number} limit - Number of bars to fetch (default: 200)
   * @returns {Promise<Object>} Market data formatted for indicators
   */
  static async getRecentBarsForIndicators(symbol, timeframe, limit = 200) {
    const rows = await this.getRecentBars(symbol, timeframe, limit);

    if (rows.length === 0) {
      throw new Error(`No data found for ${symbol} on ${timeframe} timeframe`);
    }

    // Transform to indicator format
    return {
      close: rows.map(r => parseFloat(r.close)),
      high: rows.map(r => parseFloat(r.high)),
      low: rows.map(r => parseFloat(r.low)),
      volume: rows.map(r => parseInt(r.volume)),
      timestamp: rows.map(r => r.timestamp),
      open: rows.map(r => parseFloat(r.open)), // Optional but useful
      vwap: rows.map(r => r.vwap ? parseFloat(r.vwap) : null), // Optional
    };
  }

  /**
   * Get the latest bar for a symbol
   * @param {string} symbol - Stock symbol
   * @param {string} timeframe - Timeframe
   * @returns {Promise<Object>} Latest bar
   */
  static async getLatestBar(symbol, timeframe) {
    const tableName = TABLE_MAP[timeframe];

    if (!tableName) {
      throw new Error(`Invalid timeframe: ${timeframe}`);
    }

    const row = await db(tableName)
      .where({ symbol })
      .orderBy("timestamp", "desc")
      .first();

    return row;
  }

  /**
   * Get bars within a date range
   * @param {string} symbol - Stock symbol
   * @param {string} timeframe - Timeframe
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Bars in date range
   */
  static async getBarsByDateRange(symbol, timeframe, startDate, endDate) {
    const tableName = TABLE_MAP[timeframe];

    if (!tableName) {
      throw new Error(`Invalid timeframe: ${timeframe}`);
    }

    const rows = await db(tableName)
      .where({ symbol })
      .whereBetween("timestamp", [startDate, endDate])
      .orderBy("timestamp", "asc");

    return rows;
  }

  /**
   * Check if we have enough data for indicators
   * @param {string} symbol - Stock symbol
   * @param {string} timeframe - Timeframe
   * @param {number} requiredBars - Minimum bars needed (default: 50)
   * @returns {Promise<boolean>} True if enough data exists
   */
  static async hasEnoughData(symbol, timeframe, requiredBars = 50) {
    const tableName = TABLE_MAP[timeframe];

    if (!tableName) {
      throw new Error(`Invalid timeframe: ${timeframe}`);
    }

    const count = await db(tableName)
      .where({ symbol })
      .count('* as count')
      .first();

    return parseInt(count.count) >= requiredBars;
  }
}

export default DatabaseOperations;
