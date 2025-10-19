import { TABLE_MAP } from "../../config.js";

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
   * Check if historical data exists
   * @param {string} ticker
   * @param {string} timeframe
   * @returns {Promise<boolean>}
   */
  async hasData(ticker, timeframe) {
    const data = await this.load(ticker, timeframe);
    return data.length > 0;
  }
}

export default HistoricalLoader;
