import { TABLE_MAP } from "../config.js";

import db from "./db-connection.js";

class DatabaseSchema {
  // Initialize database schema
  static async initializeSchema() {
    try {
      // Enable UUID extension
      await db.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

      // Create user table
      await db.raw(`
        CREATE TABLE IF NOT EXISTS "user" (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          "emailVerified" BOOLEAN NOT NULL DEFAULT false,
          image VARCHAR(255),
          "createdAt" TIMESTAMPTZ DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Create user table index
      await db.raw(`CREATE INDEX IF NOT EXISTS ix_user_email ON "user"(email)`);

      // Create session table
      await db.raw(`
        CREATE TABLE IF NOT EXISTS "session" (
          id VARCHAR(255) PRIMARY KEY,
          "userId" VARCHAR(255) NOT NULL,
          token VARCHAR(255) UNIQUE NOT NULL,
          "expiresAt" TIMESTAMPTZ NOT NULL,
          "ipAddress" VARCHAR(255),
          "userAgent" VARCHAR(255),
          "createdAt" TIMESTAMPTZ DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
          CONSTRAINT fk_session_user
            FOREIGN KEY("userId")
              REFERENCES "user"(id) ON DELETE CASCADE
        )
      `);

      // Create account table
      await db.raw(`
        CREATE TABLE IF NOT EXISTS "account" (
          id VARCHAR(255) PRIMARY KEY,
          "userId" VARCHAR(255) NOT NULL,
          "accountId" VARCHAR(255) NOT NULL,
          "providerId" VARCHAR(255) NOT NULL,
          "accessToken" TEXT,
          "refreshToken" TEXT,
          "accessTokenExpiresAt" TIMESTAMPTZ,
          "refreshTokenExpiresAt" TIMESTAMPTZ,
          scope VARCHAR(255),
          "idToken" TEXT,
          password TEXT,
          "createdAt" TIMESTAMPTZ DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
          CONSTRAINT fk_account_user
            FOREIGN KEY("userId")
              REFERENCES "user"(id) ON DELETE CASCADE
        )
      `);

      // Create verification table
      await db.raw(`
        CREATE TABLE IF NOT EXISTS "verification" (
          id VARCHAR(255) PRIMARY KEY,
          identifier VARCHAR(255) NOT NULL,
          value VARCHAR(255) NOT NULL,
          "expiresAt" TIMESTAMPTZ NOT NULL,
          "createdAt" TIMESTAMPTZ DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ DEFAULT NOW()
        )
      `);

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
}

export default DatabaseSchema;
