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

      // Create technical analysis table
      await db.raw(`
        CREATE TABLE IF NOT EXISTS technical_analysis (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          symbol VARCHAR NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL,
          timeframe VARCHAR NOT NULL,
          indicators JSONB NOT NULL,
          signals JSONB,
          calculated_at TIMESTAMPTZ DEFAULT NOW(),
          data_points_used INTEGER,
          UNIQUE(symbol, timestamp, timeframe)
        )
      `);

      // Create indexes for technical analysis
      await db.raw(
        `CREATE INDEX IF NOT EXISTS idx_ta_symbol_timeframe ON technical_analysis(symbol, timeframe)`
      );
      await db.raw(
        `CREATE INDEX IF NOT EXISTS idx_ta_timestamp ON technical_analysis(timestamp DESC)`
      );
      await db.raw(
        `CREATE INDEX IF NOT EXISTS idx_ta_lookup ON technical_analysis(symbol, timeframe, timestamp DESC)`
      );

      console.log("Database schema initialized successfully");
    } catch (error) {
      console.error("Schema initialization failed:", error);
      throw error;
    }
  }

  // Insert market data with batching (handles large datasets)
  static async insertMarketData(dataArray, tableName) {
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

  // Get recent market data with limit (optimized for streaming)
  static async getRecentMarketData(symbol, tableName, limit = 500) {
    return await db(tableName)
      .where({ symbol })
      .orderBy("timestamp", "desc")
      .limit(limit)
      .then(rows => rows.reverse()); // Reverse to get chronological order
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

  /**
   * Save technical analysis results
   * @param {Array} analysisData - Array of analysis objects
   */
  static async saveTechnicalAnalysis(analysisData) {
    const BATCH_SIZE = 1000;
    let totalInserted = 0;

    await db.transaction(async (trx) => {
      for (let i = 0; i < analysisData.length; i += BATCH_SIZE) {
        const batch = analysisData.slice(i, i + BATCH_SIZE);

        await trx("technical_analysis")
          .insert(
            batch.map((item) => ({
              symbol: item.symbol,
              timeframe: item.timeframe,
              timestamp: item.timestamp,
              indicators: JSON.stringify(item.indicators),
              signals: item.signals ? JSON.stringify(item.signals) : null,
              data_points_used: item.dataPointsUsed,
            }))
          )
          .onConflict(["symbol", "timestamp", "timeframe"])
          .merge();

        totalInserted += batch.length;
        console.log(
          `Saved TA batch: ${batch.length} records (${totalInserted}/${analysisData.length} total)`
        );
      }
    });

    console.log(`Bulk saved ${totalInserted} technical analysis records`);
  }
}

export default DatabaseOperations;
