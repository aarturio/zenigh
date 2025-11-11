class HistoricalLoader {
  constructor(dbOperations) {
    this.dbOperations = dbOperations;
  }

  /**
   * Load historical data for a ticker/timeframe
   * @param {string} ticker - Stock symbol
   * @param {string} timeframe - Timeframe (1T, 5T, 1H, 1D)
   * @param {number|null} limit - Maximum number of bars to load (default: 10000)
   * @returns {Promise<Array>} Historical bars
   */
  async load(ticker, timeframe, limit = 10000) {
    console.log(`Loading historical data for ${ticker} (${timeframe})...`);

    try {
      const marketData = await this.dbOperations.getMarketData(
        ticker,
        timeframe,
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
