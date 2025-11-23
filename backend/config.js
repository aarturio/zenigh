const SYMBOLS = [
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "NVDA",
  "META",
  "TSLA",
  "NFLX",
  "SNOW",
  "RDDT",
];

const TABLE_MAP = {
  "1T": "market_data_1m",
  "5T": "market_data_5m",
  "1H": "market_data_1h",
  "1D": "market_data_1d",
};

const INDICATORS = {
  SMA5: {
    function: "SMA",
    dataType: "close",
    params: { period: 5 },
  }, // Ultra short term momentum
  SMA8: {
    function: "SMA",
    dataType: "close",
    params: { period: 8 },
  }, // Fibonacci level
  SMA10: {
    function: "SMA",
    dataType: "close",
    params: { period: 10 },
  }, // Two-week trend
  SMA13: {
    function: "SMA",
    dataType: "close",
    params: { period: 13 },
  }, // Fibonacci level
  SMA20: {
    function: "SMA",
    dataType: "close",
    params: { period: 20 },
  }, // Monthly trend
  SMA34: {
    function: "SMA",
    dataType: "close",
    params: { period: 34 },
  }, // Fibonacci level
  SMA50: {
    function: "SMA",
    dataType: "close",
    params: { period: 50 },
  }, // Quarterly trend
  SMA100: {
    function: "SMA",
    dataType: "close",
    params: { period: 100 },
  }, // Psychological level
  SMA150: {
    function: "SMA",
    dataType: "close",
    params: { period: 150 },
  }, // Weinstein's level
  SMA200: {
    function: "SMA",
    dataType: "close",
    params: { period: 200 },
  }, // Long term MA
  EMA5: {
    function: "EMA",
    dataType: "close",
    params: { period: 5 },
  }, // Ultra short term momentum
  EMA8: {
    function: "EMA",
    dataType: "close",
    params: { period: 8 },
  }, // Fibonacci level
  EMA10: {
    function: "EMA",
    dataType: "close",
    params: { period: 10 },
  }, // Two-week trend
  EMA13: {
    function: "EMA",
    dataType: "close",
    params: { period: 13 },
  }, // Fibonacci level
  EMA20: {
    function: "EMA",
    dataType: "close",
    params: { period: 20 },
  }, // Monthly trend
  EMA34: {
    function: "EMA",
    dataType: "close",
    params: { period: 34 },
  }, // Fibonacci level
  EMA50: {
    function: "EMA",
    dataType: "close",
    params: { period: 50 },
  }, // Quarterly trend
  EMA100: {
    function: "EMA",
    dataType: "close",
    params: { period: 100 },
  }, // Psychological level
  EMA150: {
    function: "EMA",
    dataType: "close",
    params: { period: 150 },
  }, // Weinstein's level
  EMA200: {
    function: "EMA",
    dataType: "close",
    params: { period: 200 },
  }, // Long term MA
  RSI: {
    function: "RSI",
    dataType: "close",
    params: { period: 14 },
  },
  MACD: {
    function: "MACD",
    dataType: "close",
    params: { fast: 12, slow: 26, signal: 9 },
  },
  BBANDS: {
    function: "BBANDS",
    dataType: "close",
    params: { period: 20, stddev: 2.0 },
  },
  STOCH: {
    function: "STOCH",
    dataType: "hlc",
    params: { k_period: 14, d_period: 3 },
  },
  ATR: {
    function: "ATR",
    dataType: "hlc",
    params: { period: 14 },
  },
  ADX: {
    function: "ADX",
    dataType: "hlc",
    params: { period: 14 },
  },
  CCI: {
    function: "CCI",
    dataType: "hlc",
    params: { period: 14 },
  },
  OBV: {
    function: "OBV",
    dataType: "volume",
    params: {},
  },
};

const INDICATOR_CONFIG = {
  trend: {
    sma: [5, 8, 10, 13, 20, 34, 50, 100, 150, 200],
    ema: [5, 8, 10, 13, 20, 34, 50, 100, 150, 200],
  },
};

export { TABLE_MAP, SYMBOLS, INDICATORS, INDICATOR_CONFIG };
