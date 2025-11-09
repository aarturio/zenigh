import { TABLE_MAP } from "../config.js";

class HistoricalLoader {
  constructor(dbOperations) {
    this.dbOperations = dbOperations;
  }

  /**
   * Load historical data for a ticker/timeframe
   * @param {string} ticker - Stock symbol
   * @param {string} timeframe - Timeframe (e.g., '1Min', '1Day')
   * @param {number|null} limit - Maximum number of bars to load (default: 10000)
   * @returns {Promise<Array>} Historical bars
   */
  async load(ticker, timeframe, limit = 10000) {
    this.validateParameters(ticker, timeframe);
    const tableName = TABLE_MAP[timeframe];

    console.log(`Loading historical data for ${ticker} (${timeframe})...`);

    try {
      const marketData = await this.dbOperations.getMarketData(
        ticker,
        tableName,
        limit
      );

      console.log(`Loaded ${marketData.length} historical bars`);
      return marketData;
    } catch (error) {
      console.error("Error loading historical data:", error);
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
    const data = await this.load(ticker, timeframe, 1);
    return data.length > 0;
  }
}

export default HistoricalLoader;
