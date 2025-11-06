import { TABLE_MAP } from "../config.js";

class HistoricalLoader {
  constructor(dbOperations) {
    this.dbOperations = dbOperations;
  }

  /**
   * Load historical data for a ticker/timeframe
   * @param {string} ticker - Stock symbol
   * @param {string} timeframe - Timeframe (e.g., '1Min', '1Day')
   * @returns {Promise<Array>} Historical bars
   */
  async load(ticker, timeframe) {
    this.validateParameters(ticker, timeframe);
    const tableName = TABLE_MAP[timeframe];

    console.log(`Loading historical data for ${ticker} (${timeframe})...`);

    try {
      const marketData = await this.dbOperations.getMarketData(
        ticker,
        tableName
      );

      console.log(`Loaded ${marketData.length} historical bars`);
      return marketData;
    } catch (error) {
      console.error("Error loading historical data:", error);
      throw error;
    }
  }

  /**
   * Load recent historical data (optimized for streaming)
   * @param {string} ticker - Stock symbol
   * @param {string} timeframe - Timeframe (e.g., '1Min', '1Day')
   * @param {number} limit - Maximum number of bars to load (default: 500)
   * @returns {Promise<Array>} Recent historical bars
   */
  async loadRecent(ticker, timeframe, limit = 500) {
    this.validateParameters(ticker, timeframe);
    const tableName = TABLE_MAP[timeframe];

    console.log(`Loading last ${limit} bars for ${ticker} (${timeframe})...`);

    try {
      const marketData = await this.dbOperations.getRecentMarketData(
        ticker,
        tableName,
        limit
      );

      console.log(`Loaded ${marketData.length} historical bars`);
      return marketData;
    } catch (error) {
      console.error("Error loading recent historical data:", error);
      throw error;
    }
  }

  /**
   * Validate parameters
   * @private
   */
  validateParameters(ticker, timeframe) {
    if (!ticker) {
      throw new Error("Ticker is required");
    }

    if (!timeframe) {
      throw new Error("Timeframe is required");
    }

    const tableName = TABLE_MAP[timeframe];
    if (!tableName) {
      throw new Error(`Invalid timeframe: ${timeframe}`);
    }
  }

  /**
   * Check if historical data exists
   * @param {string} ticker
   * @param {string} timeframe
   * @returns {Promise<boolean>}
   */
  async hasData(ticker, timeframe) {
    const data = await this.loadRecent(ticker, timeframe, 1);
    return data.length > 0;
  }
}

export default HistoricalLoader;
