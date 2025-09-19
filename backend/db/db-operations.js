import pool from "./connection.js";
import { z } from "zod";
import { TABLE_MAP } from "../config.js";

const MarketDataSchema = z.object({
  symbol: z.string().min(1),
  timestamp: z.union([z.string().datetime(), z.date()]),
  open: z.number().positive(),
  high: z.number().positive(),
  low: z.number().positive(),
  close: z.number().positive(),
  volume: z.number().int().nonnegative(),
  trade_count: z.number().int().optional(),
  vwap: z.number().optional(),
});

class DatabaseOperations {
  // Initialize database schema
  static async initializeSchema() {
    const client = await pool.connect();
    try {
      // Enable UUID extension
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

      // Create table if not exists

      // Create users table
      await client.query(`
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
      await client.query(
        `CREATE INDEX IF NOT EXISTS ix_users_email ON users(email)`
      );

      for (const tableName of Object.values(TABLE_MAP)) {
        await client.query(`
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
        await client.query(
          `CREATE INDEX IF NOT EXISTS ix_${tableName}_symbol ON ${tableName}(symbol)`
        );
        await client.query(
          `CREATE INDEX IF NOT EXISTS ix_${tableName}_timestamp ON ${tableName}(timestamp)`
        );
        await client.query(
          `CREATE UNIQUE INDEX IF NOT EXISTS ix_${tableName}_symbol_timestamp ON ${tableName}(symbol, timestamp)`
        );
      }

      console.log("Database schema initialized successfully");
    } finally {
      client.release();
    }
  }

  // Bulk insert market data with batching (handles large datasets)
  static async bulkInsertMarketData(dataArray, tableName) {
    // Validate table name
    const tableNameSchema = z.enum(Object.values(TABLE_MAP));
    tableNameSchema.parse(tableName);

    // Validate data array
    const dataArraySchema = z.array(MarketDataSchema).min(1);
    dataArraySchema.parse(dataArray);

    const client = await pool.connect();
    const BATCH_SIZE = 5000;
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
          INSERT INTO ${tableName} (symbol, timestamp, open, high, low, close, volume, trade_count, vwap)
          VALUES ${placeholders}
          ON CONFLICT (symbol, timestamp) DO NOTHING
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
  static async getMarketData(symbol, tableName) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT * FROM ${tableName}
        WHERE symbol = $1 
        ORDER BY timestamp ASC
      `;

      const result = await client.query(query, [symbol]);
      return result.rows;
    } finally {
      client.release();
    }
  }
}

export default DatabaseOperations;
