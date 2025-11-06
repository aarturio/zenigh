class DataTransformer {
  /**
   * Transform database records to frontend format
   * @param {Array} dbRecords - Records from database
   * @returns {Array} Formatted bars for frontend
   */
  static dbToFrontend(dbRecords) {
    return dbRecords.map((bar) => ({
      symbol: bar.symbol,
      closePrice: bar.close,
      timestamp: new Date(bar.timestamp).getTime(),
    }));
  }

  /**
   * Transform Alpaca bar to frontend format
   * @param {Object} alpacaBar - Raw bar from Alpaca API
   * @returns {Object} Formatted bar
   */
  static alpacaToFrontend(alpacaBar) {
    return {
      symbol: alpacaBar.S,
      closePrice: alpacaBar.c,
      timestamp: new Date(alpacaBar.t).getTime(),
    };
  }
}

export default DataTransformer;
