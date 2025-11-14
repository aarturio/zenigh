import { TABLE_MAP } from "../config.js";

import db from "./db-connection.js";

class DatabaseOperations {
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

  /**
   * Get market data by symbol and timeframe
   * @param {string} symbol - Stock symbol
   * @param {string} timeframe - Timeframe (1T, 5T, 1H, 1D)
   * @returns {Promise<Array>} Array of OHLCV bars in chronological order (oldest to newest)
   */
  static async getMarketData(symbol, timeframe) {
    const tableName = TABLE_MAP[timeframe];

    if (!tableName) {
      throw new Error(
        `Invalid timeframe: ${timeframe}. Valid options: ${Object.keys(
          TABLE_MAP
        ).join(", ")}`
      );
    }

    // Get all data for this symbol/timeframe
    const rows = await db(tableName)
      .where({ symbol })
      .orderBy("timestamp", "desc");

    // Return in chronological order (oldest to newest)
    return rows.reverse();
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

  /**
   * Get technical analysis data by symbol and timeframe
   * @param {string} symbol - Stock symbol
   * @param {string} timeframe - Timeframe (1T, 5T, 1H, 1D)
   * @returns {Promise<Array>} Array of technical analysis records in chronological order (oldest to newest)
   */
  static async getTechnicalAnalysis(symbol, timeframe) {
    const tableName = "technical_analysis";

    // Get all TA data for this symbol/timeframe
    const rows = await db(tableName)
      .where({ symbol, timeframe })
      .orderBy("timestamp", "desc");

    // Return in chronological order (oldest to newest)
    return rows.reverse();
  }
}

export default DatabaseOperations;
