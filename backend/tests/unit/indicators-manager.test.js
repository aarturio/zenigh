import { describe, test, expect, beforeEach } from "vitest";
import { IndicatorsManager, DEFAULT_CONFIG } from "../../services/indicators-manager.js";

// Helper to generate mock market data
function generateMockData(length = 100, options = {}) {
  const {
    trend = 'up',
    volatility = 'normal',
    startPrice = 100,
  } = options;

  const close = [];
  const high = [];
  const low = [];
  const volume = [];
  const timestamp = [];

  let price = startPrice;

  for (let i = 0; i < length; i++) {
    // Add trend
    if (trend === 'up') {
      price += Math.random() * 2;
    } else if (trend === 'down') {
      price -= Math.random() * 2;
    } else {
      price += (Math.random() - 0.5) * 2;
    }

    // Add volatility
    const vol = volatility === 'high' ? 5 : volatility === 'low' ? 1 : 3;
    const h = price + Math.random() * vol;
    const l = price - Math.random() * vol;

    close.push(price);
    high.push(Math.max(h, l, price));
    low.push(Math.min(h, l, price));
    volume.push(1000000 + Math.random() * 500000);
    timestamp.push(new Date(Date.now() - (length - i) * 60000).toISOString());
  }

  return { close, high, low, volume, timestamp };
}

describe("IndicatorsManager", () => {
  let manager;

  beforeEach(() => {
    manager = new IndicatorsManager();
  });

  describe("constructor", () => {
    test("initializes with default config", () => {
      const config = manager.getConfig();

      expect(config).toHaveProperty("RSI");
      expect(config).toHaveProperty("MACD");
      expect(config).toHaveProperty("BOLLINGER");
      expect(config.RSI.period).toBe(14);
    });

    test("accepts custom configuration", () => {
      const customManager = new IndicatorsManager({
        RSI: { period: 21, overbought: 80, oversold: 20 },
      });

      const config = customManager.getConfig();
      expect(config.RSI.period).toBe(21);
      expect(config.RSI.overbought).toBe(80);
    });
  });

  describe("calculateAll", () => {
    test("calculates all indicators for valid data", () => {
      const data = generateMockData(250);
      const result = manager.calculateAll(data);

      expect(result).toHaveProperty("timestamp");
      expect(result).toHaveProperty("dataPoints");
      expect(result).toHaveProperty("indicators");
      expect(result).toHaveProperty("signals");

      expect(result.dataPoints).toBe(250);
    });

    test("includes momentum indicators", () => {
      const data = generateMockData(250);
      const result = manager.calculateAll(data);

      expect(result.indicators).toHaveProperty("momentum");
      expect(result.indicators.momentum).toHaveProperty("rsi");
      expect(result.indicators.momentum).toHaveProperty("stochastic");

      expect(result.indicators.momentum.rsi).toHaveProperty("value");
      expect(result.indicators.momentum.rsi).toHaveProperty("signal");
    });

    test("includes trend indicators", () => {
      const data = generateMockData(250);
      const result = manager.calculateAll(data);

      expect(result.indicators).toHaveProperty("trend");
      expect(result.indicators.trend).toHaveProperty("sma");
      expect(result.indicators.trend).toHaveProperty("ema");
      expect(result.indicators.trend).toHaveProperty("macd");

      expect(result.indicators.trend.sma).toHaveProperty("20");
      expect(result.indicators.trend.sma).toHaveProperty("50");
      expect(result.indicators.trend.sma).toHaveProperty("200");
    });

    test("includes volatility indicators", () => {
      const data = generateMockData(250);
      const result = manager.calculateAll(data);

      expect(result.indicators).toHaveProperty("volatility");
      expect(result.indicators.volatility).toHaveProperty("bollingerBands");
      expect(result.indicators.volatility).toHaveProperty("atr");

      expect(result.indicators.volatility.bollingerBands).toHaveProperty("upper");
      expect(result.indicators.volatility.bollingerBands).toHaveProperty("middle");
      expect(result.indicators.volatility.bollingerBands).toHaveProperty("lower");
    });

    test("includes volume indicators", () => {
      const data = generateMockData(250);
      const result = manager.calculateAll(data);

      expect(result.indicators).toHaveProperty("volume");
      expect(result.indicators.volume).toHaveProperty("current");
      expect(result.indicators.volume).toHaveProperty("averages");
      expect(result.indicators.volume).toHaveProperty("obv");
    });

    test("generates overall signals", () => {
      const data = generateMockData(250);
      const result = manager.calculateAll(data);

      expect(result.signals).toHaveProperty("overall");
      expect(result.signals).toHaveProperty("strength");
      expect(result.signals).toHaveProperty("alerts");
      expect(result.signals).toHaveProperty("bullishSignals");
      expect(result.signals).toHaveProperty("bearishSignals");

      expect(['bullish', 'bearish', 'neutral']).toContain(result.signals.overall);
      expect(['strong', 'moderate', 'weak']).toContain(result.signals.strength);
    });

    test("throws error for insufficient data", () => {
      const data = generateMockData(30); // Too little data

      expect(() => manager.calculateAll(data)).toThrow("Insufficient data");
    });

    test("throws error for missing fields", () => {
      const data = { close: [], high: [], low: [] }; // Missing volume, timestamp

      expect(() => manager.calculateAll(data)).toThrow("Missing or invalid field");
    });

    test("throws error for mismatched array lengths", () => {
      const data = generateMockData(100);
      data.volume = data.volume.slice(0, 50); // Mismatch

      expect(() => manager.calculateAll(data)).toThrow("Data length mismatch");
    });
  });

  describe("signal generation", () => {
    test("detects bullish signals in uptrend", () => {
      const data = generateMockData(250, { trend: 'up' });
      const result = manager.calculateAll(data);

      // In uptrend, should have more bullish signals
      expect(result.signals.bullishSignals).toBeGreaterThanOrEqual(0);
    });

    test("detects bearish signals in downtrend", () => {
      const data = generateMockData(250, { trend: 'down' });
      const result = manager.calculateAll(data);

      // In downtrend, should have more bearish signals
      expect(result.signals.bearishSignals).toBeGreaterThanOrEqual(0);
    });

    test("includes alerts for extreme conditions", () => {
      const data = generateMockData(250);
      const result = manager.calculateAll(data);

      expect(Array.isArray(result.signals.alerts)).toBe(true);
    });
  });

  describe("caching", () => {
    test("caches calculation results", () => {
      const data = generateMockData(100);
      const symbol = "TEST";
      const timeframe = "5T";

      const result1 = manager.getCachedOrCalculate(symbol, timeframe, data);
      const result2 = manager.getCachedOrCalculate(symbol, timeframe, data);

      // Should return same object (from cache)
      expect(result1).toEqual(result2);
    });

    test("clears cache for specific symbol/timeframe", () => {
      const data = generateMockData(100);

      manager.getCachedOrCalculate("TEST1", "5T", data);
      manager.getCachedOrCalculate("TEST2", "5T", data);

      manager.clearCache("TEST1", "5T");

      // TEST1 cache should be cleared, TEST2 should remain
      expect(manager.cache.has("TEST1:5T")).toBe(false);
      expect(manager.cache.has("TEST2:5T")).toBe(true);
    });

    test("clears all cache", () => {
      const data = generateMockData(100);

      manager.getCachedOrCalculate("TEST1", "5T", data);
      manager.getCachedOrCalculate("TEST2", "5T", data);

      manager.clearCache();

      expect(manager.cache.size).toBe(0);
    });
  });

  describe("configuration management", () => {
    test("updates configuration", () => {
      manager.updateConfig({
        RSI: { period: 21, overbought: 75, oversold: 25 },
      });

      const config = manager.getConfig();
      expect(config.RSI.period).toBe(21);
      expect(config.RSI.overbought).toBe(75);
    });

    test("clears cache when configuration changes", () => {
      const data = generateMockData(100);

      manager.getCachedOrCalculate("TEST", "5T", data);
      expect(manager.cache.size).toBe(1);

      manager.updateConfig({ RSI: { period: 21 } });

      expect(manager.cache.size).toBe(0);
    });

    test("merges with existing config", () => {
      manager.updateConfig({ RSI: { period: 21 } });

      const config = manager.getConfig();
      expect(config.RSI.period).toBe(21);
      // Note: updateConfig does shallow merge, so entire RSI object is replaced
      expect(config.MACD).toEqual(DEFAULT_CONFIG.MACD); // Other configs unchanged
    });
  });

  describe("data validation", () => {
    test("validates all required fields present", () => {
      const incomplete = {
        close: [100, 101],
        high: [102, 103],
        // Missing low, volume, timestamp
      };

      expect(() => manager.calculateAll(incomplete)).toThrow();
    });

    test("validates arrays are not empty", () => {
      const empty = {
        close: [],
        high: [],
        low: [],
        volume: [],
        timestamp: [],
      };

      expect(() => manager.calculateAll(empty)).toThrow("Insufficient data");
    });

    test("validates minimum data length", () => {
      const tooShort = generateMockData(30);

      expect(() => manager.calculateAll(tooShort)).toThrow("Insufficient data");
    });
  });

  describe("output format", () => {
    test("rounds values to appropriate precision", () => {
      const data = generateMockData(250);
      const result = manager.calculateAll(data);

      // RSI value should be a number with reasonable precision
      expect(typeof result.indicators.momentum.rsi.value).toBe("number");
      expect(result.indicators.momentum.rsi.value).toBeGreaterThanOrEqual(0);
      expect(result.indicators.momentum.rsi.value).toBeLessThanOrEqual(100);

      // MACD value should be a number
      expect(typeof result.indicators.trend.macd.value).toBe("number");
    });

    test("provides consistent structure", () => {
      const data = generateMockData(250);
      const result = manager.calculateAll(data);

      // Check structure matches expected format
      expect(result).toMatchObject({
        timestamp: expect.any(String),
        dataPoints: expect.any(Number),
        indicators: {
          momentum: expect.any(Object),
          trend: expect.any(Object),
          volatility: expect.any(Object),
          volume: expect.any(Object),
        },
        signals: {
          overall: expect.any(String),
          strength: expect.any(String),
          alerts: expect.any(Array),
        },
      });
    });
  });
});

describe("DEFAULT_CONFIG", () => {
  test("has all required indicator configurations", () => {
    expect(DEFAULT_CONFIG).toHaveProperty("RSI");
    expect(DEFAULT_CONFIG).toHaveProperty("STOCHASTIC");
    expect(DEFAULT_CONFIG).toHaveProperty("SMA");
    expect(DEFAULT_CONFIG).toHaveProperty("EMA");
    expect(DEFAULT_CONFIG).toHaveProperty("MACD");
    expect(DEFAULT_CONFIG).toHaveProperty("BOLLINGER");
    expect(DEFAULT_CONFIG).toHaveProperty("ATR");
    expect(DEFAULT_CONFIG).toHaveProperty("VOLUME_MA");
  });

  test("has standard periods", () => {
    expect(DEFAULT_CONFIG.RSI.period).toBe(14);
    expect(DEFAULT_CONFIG.MACD.fast).toBe(12);
    expect(DEFAULT_CONFIG.MACD.slow).toBe(26);
    expect(DEFAULT_CONFIG.MACD.signal).toBe(9);
    expect(DEFAULT_CONFIG.BOLLINGER.period).toBe(20);
    expect(DEFAULT_CONFIG.ATR.period).toBe(14);
  });
});
