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

const INDICATOR_CATEGORIES = {
  trend: {
    title: "Trend",
    indicators: [
      { id: "sma5", label: "SMA 5", color: "#f59e0b" },
      { id: "sma8", label: "SMA 8", color: "#f59e0b" },
      { id: "sma10", label: "SMA 10", color: "#f59e0b" },
      { id: "sma13", label: "SMA 13", color: "#f59e0b" },
      { id: "sma20", label: "SMA 20", color: "#f59e0b" },
      { id: "sma34", label: "SMA 34", color: "#f59e0b" },
      { id: "sma50", label: "SMA 50", color: "#f59e0b" },
      { id: "sma100", label: "SMA 100", color: "#f59e0b" },
      { id: "sma150", label: "SMA 150", color: "#f59e0b" },
      { id: "sma200", label: "SMA 200", color: "#f59e0b" },
      { id: "ema5", label: "EMA 5", color: "#3b82f6" },
      { id: "ema8", label: "EMA 8", color: "#3b82f6" },
      { id: "ema10", label: "EMA 10", color: "#3b82f6" },
      { id: "ema13", label: "EMA 13", color: "#3b82f6" },
      { id: "ema20", label: "EMA 20", color: "#6366f1" },
      { id: "ema34", label: "EMA 34", color: "#6366f1" },
      { id: "ema50", label: "EMA 50", color: "#6366f1" },
      { id: "ema100", label: "EMA 100", color: "#6366f1" },
      { id: "ema150", label: "EMA 150", color: "#6366f1" },
      { id: "ema200", label: "EMA 200", color: "#6366f1" },
      { id: "macd12_26_9_value", label: "MACD Line", color: "#ec4899" },
      { id: "macd12_26_9_signal", label: "MACD Signal", color: "#f472b6" },
      { id: "macd12_26_9_histogram", label: "MACD Histogram", color: "#fb923c" },
      { id: "adx14", label: "ADX (14)", color: "#84cc16" },
      { id: "cci14", label: "CCI (14)", color: "#eab308" },
    ],
  },
  momentum: {
    title: "Momentum",
    indicators: [
      { id: "rsi14", label: "RSI (14)", color: "#a855f7" },
      { id: "stochastic14_3_k", label: "Stochastic %K", color: "#8b5cf6" },
      { id: "stochastic14_3_d", label: "Stochastic %D", color: "#a78bfa" },
    ],
  },
  volatility: {
    title: "Volatility",
    indicators: [
      { id: "bbands20_2.0_upper", label: "BB Upper", color: "#06b6d4" },
      { id: "bbands20_2.0_middle", label: "BB Middle", color: "#22d3ee" },
      { id: "bbands20_2.0_lower", label: "BB Lower", color: "#67e8f9" },
      { id: "atr14", label: "ATR (14)", color: "#14b8a6" },
    ],
  },
  volume: {
    title: "Volume",
    indicators: [
      { id: "obvdefault", label: "OBV", color: "#f97316" },
    ],
  },
};

export { SYMBOLS, INDICATOR_CATEGORIES };
