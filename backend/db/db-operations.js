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

    try {
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
    } catch (error) {
      throw error;
    }
  }

  // Get market data by symbol and date range
  static async getMarketData(symbol, tableName) {
    return await db(tableName)
      .where({ symbol })
      .orderBy("timestamp", "asc");
  }
}

export default DatabaseOperations;
