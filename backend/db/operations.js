const pool = require("./connection");

class MarketDataOperations {
  // Initialize database schema
  static async initializeSchema() {
    const client = await pool.connect();
    try {
      // Enable UUID extension
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

      // Create table if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS market_data (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          symbol VARCHAR NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL,
          open DOUBLE PRECISION NOT NULL,
          high DOUBLE PRECISION NOT NULL,
          low DOUBLE PRECISION NOT NULL,
          close DOUBLE PRECISION NOT NULL,
          volume BIGINT NOT NULL,
          trade_count INTEGER,
          vwap DOUBLE PRECISION
        )
      `);

      // Create indexes
      await client.query(
        "CREATE INDEX IF NOT EXISTS ix_market_data_symbol ON market_data(symbol)"
      );
      await client.query(
        "CREATE INDEX IF NOT EXISTS ix_market_data_timestamp ON market_data(timestamp)"
      );
      await client.query(
        "CREATE INDEX IF NOT EXISTS ix_market_data_symbol_timestamp ON market_data(symbol, timestamp)"
      );

      console.log("Database schema initialized successfully");
    } finally {
      client.release();
    }
  }

  // Insert single market data record
  static async insertMarketData(data) {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO market_data (symbol, timestamp, open, high, low, close, volume, trade_count, vwap)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `;
      const values = [
        data.symbol,
        data.timestamp,
        data.open,
        data.high,
        data.low,
        data.close,
        data.volume,
        data.trade_count,
        data.vwap,
      ];

      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Bulk insert market data with batching (handles large datasets)
  static async bulkInsertMarketData(dataArray) {
    const client = await pool.connect();
    const BATCH_SIZE = 5000; // Process 1000 records at a time
    let totalInserted = 0;

    try {
      await client.query("BEGIN");

      // Process data in batches
      for (let i = 0; i < dataArray.length; i += BATCH_SIZE) {
        const batch = dataArray.slice(i, i + BATCH_SIZE);

        const placeholders = batch
          .map((_, index) => {
            const base = index * 9;
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${
              base + 5
            }, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9})`;
          })
          .join(", ");

        const query = `
          INSERT INTO market_data (symbol, timestamp, open, high, low, close, volume, trade_count, vwap)
          VALUES ${placeholders}
        `;

        const values = batch.flatMap((data) => [
          data.symbol,
          data.timestamp,
          data.open,
          data.high,
          data.low,
          data.close,
          data.volume,
          data.trade_count || null,
          data.vwap || null,
        ]);

        await client.query(query, values);
        totalInserted += batch.length;
        console.log(
          `Inserted batch: ${batch.length} records (${totalInserted}/${dataArray.length} total)`
        );
      }

      await client.query("COMMIT");
      console.log(
        `Bulk inserted ${totalInserted} records in ${Math.ceil(
          dataArray.length / BATCH_SIZE
        )} batches`
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // Get market data by symbol and date range
  static async getMarketData(symbol, startDate, endDate, limit = 1000) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT * FROM market_data
        WHERE symbol = $1 
        AND timestamp >= $2 
        AND timestamp <= $3
        ORDER BY timestamp DESC
        LIMIT $4
      `;

      const result = await client.query(query, [
        symbol,
        startDate,
        endDate,
        limit,
      ]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Get market data with pagination (like Python version)
  static async getMarketDataPaginated(symbol, limit = 100, offset = 0) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT * FROM market_data
        WHERE symbol = $1
        ORDER BY timestamp DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await client.query(query, [symbol, limit, offset]);
      return result.rows;
    } finally {
      client.release();
    }
  }
}

module.exports = MarketDataOperations;
