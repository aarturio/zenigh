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
      { id: "SMA5", label: "SMA 5", color: "#f59e0b" },
      { id: "SMA8", label: "SMA 8", color: "#f59e0b" },
      { id: "SMA10", label: "SMA 10", color: "#f59e0b" },
      { id: "SMA13", label: "SMA 13", color: "#f59e0b" },
      { id: "SMA20", label: "SMA 20", color: "#f59e0b" },
      { id: "SMA34", label: "SMA 34", color: "#f59e0b" },
      { id: "SMA50", label: "SMA 50", color: "#f59e0b" },
      { id: "SMA100", label: "SMA 100", color: "#f59e0b" },
      { id: "SMA150", label: "SMA 150", color: "#f59e0b" },
      { id: "SMA200", label: "SMA 200", color: "#f59e0b" },
      { id: "EMA5", label: "EMA 5", color: "#3b82f6" },
      { id: "EMA8", label: "EMA 8", color: "#3b82f6" },
      { id: "EMA10", label: "EMA 10", color: "#3b82f6" },
      { id: "EMA13", label: "EMA 13", color: "#3b82f6" },
      { id: "EMA20", label: "EMA 20", color: "#6366f1" },
      { id: "EMA34", label: "EMA 34", color: "#6366f1" },
      { id: "EMA50", label: "EMA 50", color: "#6366f1" },
      { id: "EMA100", label: "EMA 100", color: "#6366f1" },
      { id: "EMA150", label: "EMA 150", color: "#6366f1" },
      { id: "EMA200", label: "EMA 200", color: "#6366f1" },
    ],
  },
  momentum: {
    title: "Momentum",
    indicators: [
      { id: "RSI", label: "RSI (14)", color: "#a855f7" },
      { id: "MACD", label: "MACD", color: "#ec4899" },
      { id: "STOCH", label: "STOCH", color: "#8b5cf6" },
    ],
  },
  volatility: {
    title: "Volatility",
    indicators: [
      { id: "BBANDS", label: "BB", color: "#06b6d4" },
      { id: "ATR", label: "ATR (14)", color: "#14b8a6" },
    ],
  },
  other: {
    title: "Other",
    indicators: [
      { id: "ADX", label: "ADX (14)", color: "#84cc16" },
      { id: "CCI", label: "CCI (14)", color: "#eab308" },
      { id: "OBV", label: "OBV", color: "#f97316" },
    ],
  },
};

export { SYMBOLS, INDICATOR_CATEGORIES };
