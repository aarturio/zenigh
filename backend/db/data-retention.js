#!/usr/bin/env node

/**
 * Data Retention Script using Knex
 * Removes old market data based on retention policy
 */

import knex from "knex";

// Initialize Knex with database connection
const db = knex({
  client: "pg",
  connection: process.env.DATABASE_URL,
  pool: {
    min: 1,
    max: 2,
  },
});

// Retention policies (in days)
const RETENTION_POLICIES = {
  market_data_1m: 7, // 1-minute bars: 7 days
  market_data_5m: 7, // 5-minute bars: 7 days
  market_data_1h: 30, // 1-hour bars: 30 days
  market_data_1d: 365, // Daily bars: 1 year
};

async function cleanupOldData() {
  console.log("========================================");
  console.log(`[${new Date().toISOString()}] Starting data cleanup...`);

  let totalDeleted = 0;

  try {
    for (const [tableName, retentionDays] of Object.entries(
      RETENTION_POLICIES
    )) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      console.log(
        `Cleaning up ${tableName} (older than ${retentionDays} days)...`
      );

      const deleted = await db(tableName)
        .where("timestamp", "<", cutoffDate)
        .delete();

      console.log(`Deleted ${deleted} records from ${tableName}`);
      totalDeleted += deleted;
    }

    // Run VACUUM ANALYZE to reclaim disk space
    console.log("Running VACUUM ANALYZE to reclaim disk space...");
    await db.raw("VACUUM ANALYZE");

    console.log(
      `✅ Cleanup completed - Total deleted: ${totalDeleted} records`
    );
    console.log("========================================");

    // Exit successfully
    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
    console.error(error);
    await db.destroy();
    process.exit(1);
  }
}

// Run cleanup
cleanupOldData();
