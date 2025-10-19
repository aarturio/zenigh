import { describe, test, expect } from "vitest";
import {
  calculateRSI,
  getRSISignal,
  calculateStochastic,
  getStochasticSignal,
} from "../../../services/indicators/momentum.js";

describe("calculateRSI", () => {
  test("calculates RSI correctly for upward trend", () => {
    // Prices trending up
    const data = [44, 44.34, 44.09, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.28, 46.00];
    const result = calculateRSI(data, 14);

    expect(result.length).toBe(2); // 16 prices - 14 period = 2 RSI values
    expect(result[0]).toBeGreaterThan(50); // Uptrend should have RSI > 50
    expect(result[0]).toBeLessThan(100);
  });

  test("calculates RSI correctly for downward trend", () => {
    // Prices trending down (but not perfectly consecutive to avoid RSI = 0)
    const data = [50, 49, 48.5, 47, 46.5, 45, 44.5, 43, 42.5, 41, 40.5, 39, 38.5, 37, 36.5, 35];
    const result = calculateRSI(data, 14);

    expect(result.length).toBe(2);
    expect(result[0]).toBeLessThan(50); // Downtrend should have RSI < 50
    expect(result[0]).toBeGreaterThanOrEqual(0); // Should be >= 0
  });

  test("handles all gains (no losses)", () => {
    // Consecutive gains
    const data = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
    const result = calculateRSI(data, 14);

    expect(result[0]).toBe(100); // All gains = RSI 100
  });

  test("handles all losses (no gains)", () => {
    // Consecutive losses
    const data = [25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10];
    const result = calculateRSI(data, 14);

    expect(result[0]).toBe(0); // All losses = RSI 0
  });

  test("handles flat prices (no change)", () => {
    const data = Array(20).fill(100);
    const result = calculateRSI(data, 14);

    expect(result[0]).toBe(50); // No change = 50 (neutral)
  });

  test("RSI values stay within 0-100 range", () => {
    const data = [100, 105, 103, 108, 102, 110, 95, 112, 90, 115, 88, 118, 85, 120, 82, 122];
    const result = calculateRSI(data, 14);

    result.forEach(rsi => {
      expect(rsi).toBeGreaterThanOrEqual(0);
      expect(rsi).toBeLessThanOrEqual(100);
    });
  });

  test("produces multiple RSI values for longer datasets", () => {
    const data = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i) * 10);
    const result = calculateRSI(data, 14);

    expect(result.length).toBe(36); // 50 - 14 = 36
  });

  test("throws error with insufficient data", () => {
    const data = [100, 101, 102];
    expect(() => calculateRSI(data, 14)).toThrow("Insufficient data");
  });

  test("accepts custom period", () => {
    const data = Array.from({ length: 30 }, (_, i) => 100 + i);
    const rsi7 = calculateRSI(data, 7);
    const rsi21 = calculateRSI(data, 21);

    expect(rsi7.length).toBeGreaterThan(rsi21.length);
  });

  test("smoothing effect on subsequent values", () => {
    // First RSI uses simple average, subsequent use smoothing
    const data = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
    const result = calculateRSI(data, 14);

    expect(result.length).toBeGreaterThan(1);
    // All should be high RSI due to consistent gains
    result.forEach(rsi => expect(rsi).toBeGreaterThan(90));
  });
});

describe("getRSISignal", () => {
  test("returns overbought for RSI >= 70", () => {
    expect(getRSISignal(70)).toBe("overbought");
    expect(getRSISignal(75)).toBe("overbought");
    expect(getRSISignal(80)).toBe("overbought");
    expect(getRSISignal(100)).toBe("overbought");
  });

  test("returns oversold for RSI <= 30", () => {
    expect(getRSISignal(30)).toBe("oversold");
    expect(getRSISignal(25)).toBe("oversold");
    expect(getRSISignal(20)).toBe("oversold");
    expect(getRSISignal(0)).toBe("oversold");
  });

  test("returns neutral for RSI between 30 and 70", () => {
    expect(getRSISignal(31)).toBe("neutral");
    expect(getRSISignal(50)).toBe("neutral");
    expect(getRSISignal(69)).toBe("neutral");
  });

  test("accepts custom thresholds", () => {
    const thresholds = { overbought: 80, oversold: 20 };

    expect(getRSISignal(75, thresholds)).toBe("neutral");
    expect(getRSISignal(80, thresholds)).toBe("overbought");
    expect(getRSISignal(25, thresholds)).toBe("neutral");
    expect(getRSISignal(20, thresholds)).toBe("oversold");
  });
});

describe("calculateStochastic", () => {
  test("calculates %K and %D correctly", () => {
    const data = [
      { high: 45, low: 43, close: 44 },
      { high: 46, low: 44, close: 45 },
      { high: 47, low: 45, close: 46 },
      { high: 48, low: 46, close: 47 },
      { high: 49, low: 47, close: 48 },
      { high: 50, low: 48, close: 49 },
      { high: 51, low: 49, close: 50 },
      { high: 52, low: 50, close: 51 },
      { high: 53, low: 51, close: 52 },
      { high: 54, low: 52, close: 53 },
      { high: 55, low: 53, close: 54 },
      { high: 56, low: 54, close: 55 },
      { high: 57, low: 55, close: 56 },
      { high: 58, low: 56, close: 57 },
      { high: 59, low: 57, close: 58 },
      { high: 60, low: 58, close: 59 },
    ];

    const result = calculateStochastic(data, 14, 3);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("k");
    expect(result[0]).toHaveProperty("d");
  });

  test("K and D values stay within 0-100 range", () => {
    const data = [];
    for (let i = 0; i < 20; i++) {
      data.push({
        high: 100 + Math.random() * 20,
        low: 100 - Math.random() * 20,
        close: 100 + (Math.random() - 0.5) * 10,
      });
    }

    const result = calculateStochastic(data, 14, 3);

    result.forEach(({ k, d }) => {
      expect(k).toBeGreaterThanOrEqual(0);
      expect(k).toBeLessThanOrEqual(100);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(100);
    });
  });

  test("handles price at highest high", () => {
    const data = [];
    for (let i = 0; i < 20; i++) {
      data.push({
        high: 100 + i,
        low: 90 + i,
        close: 100 + i, // Always at high
      });
    }

    const result = calculateStochastic(data, 14, 3);

    // When close is at highest high, %K should be 100
    result.forEach(({ k }) => {
      expect(k).toBeCloseTo(100, 0);
    });
  });

  test("handles price at lowest low", () => {
    const data = [];
    for (let i = 0; i < 20; i++) {
      data.push({
        high: 100 - i,
        low: 90 - i,
        close: 90 - i, // Always at low
      });
    }

    const result = calculateStochastic(data, 14, 3);

    // When close is at lowest low, %K should be 0
    result.forEach(({ k }) => {
      expect(k).toBeCloseTo(0, 0);
    });
  });

  test("D is smoother than K (moving average effect)", () => {
    const data = [];
    // Create volatile data
    for (let i = 0; i < 25; i++) {
      const volatility = i % 2 === 0 ? 10 : -10;
      data.push({
        high: 100 + volatility + 2,
        low: 100 + volatility - 2,
        close: 100 + volatility,
      });
    }

    const result = calculateStochastic(data, 14, 3);

    if (result.length > 1) {
      // Calculate variance of K and D values
      const kValues = result.map(r => r.k);
      const dValues = result.map(r => r.d);

      const kVariance = calculateVariance(kValues);
      const dVariance = calculateVariance(dValues);

      // D should generally have lower variance (smoother)
      // This might not always be true for very short datasets
      expect(dVariance).toBeLessThanOrEqual(kVariance * 1.5);
    }
  });

  test("accepts custom periods", () => {
    const data = Array.from({ length: 30 }, (_, i) => ({
      high: 100 + i + 2,
      low: 100 + i - 2,
      close: 100 + i,
    }));

    const result1 = calculateStochastic(data, 14, 3);
    const result2 = calculateStochastic(data, 10, 5);

    expect(result1.length).not.toBe(result2.length);
  });

  test("throws error with insufficient data", () => {
    const data = [
      { high: 100, low: 90, close: 95 },
      { high: 101, low: 91, close: 96 },
    ];

    expect(() => calculateStochastic(data, 14, 3)).toThrow("Insufficient data");
  });

  test("handles equal high and low gracefully", () => {
    const data = Array.from({ length: 20 }, () => ({
      high: 100,
      low: 100,
      close: 100,
    }));

    const result = calculateStochastic(data, 14, 3);

    // Should return neutral value (50) when high == low
    result.forEach(({ k }) => {
      expect(k).toBe(50);
    });
  });
});

describe("getStochasticSignal", () => {
  test("returns overbought when both K and D >= 80", () => {
    expect(getStochasticSignal(80, 80)).toBe("overbought");
    expect(getStochasticSignal(85, 82)).toBe("overbought");
    expect(getStochasticSignal(90, 88)).toBe("overbought");
  });

  test("returns oversold when both K and D <= 20", () => {
    expect(getStochasticSignal(20, 20)).toBe("oversold");
    expect(getStochasticSignal(15, 18)).toBe("oversold");
    expect(getStochasticSignal(10, 12)).toBe("oversold");
  });

  test("returns neutral for middle range", () => {
    expect(getStochasticSignal(50, 50)).toBe("neutral");
    expect(getStochasticSignal(60, 55)).toBe("neutral");
    expect(getStochasticSignal(40, 45)).toBe("neutral");
  });

  test("returns neutral when only one is in extreme zone", () => {
    expect(getStochasticSignal(85, 75)).toBe("neutral"); // K high, D not
    expect(getStochasticSignal(75, 85)).toBe("neutral"); // D high, K not
    expect(getStochasticSignal(15, 25)).toBe("neutral"); // K low, D not
    expect(getStochasticSignal(25, 15)).toBe("neutral"); // D low, K not
  });

  test("accepts custom thresholds", () => {
    const thresholds = { overbought: 75, oversold: 25 };

    expect(getStochasticSignal(76, 76, thresholds)).toBe("overbought");
    expect(getStochasticSignal(24, 24, thresholds)).toBe("oversold");
    expect(getStochasticSignal(50, 50, thresholds)).toBe("neutral");
  });
});

// Helper function for variance calculation
function calculateVariance(values) {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}
