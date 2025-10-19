import { describe, test, expect } from "vitest";
import {
  calculateMACD,
  detectMACDCrossover,
  getMACDSignal,
  calculateMovingAverages,
  calculateExponentialMovingAverages,
} from "../../../services/indicators/trend.js";

describe("calculateMACD", () => {
  test("calculates MACD with default periods (12, 26, 9)", () => {
    // Create enough data for MACD calculation
    const data = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i / 5) * 10);
    const result = calculateMACD(data);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("macd");
    expect(result[0]).toHaveProperty("signal");
    expect(result[0]).toHaveProperty("histogram");
  });

  test("histogram equals MACD minus Signal", () => {
    const data = Array.from({ length: 50 }, (_, i) => 100 + i * 0.5);
    const result = calculateMACD(data);

    result.forEach(({ macd, signal, histogram }) => {
      expect(histogram).toBeCloseTo(macd - signal, 10);
    });
  });

  test("accepts custom periods", () => {
    const data = Array.from({ length: 60 }, (_, i) => 100 + i);
    const custom = calculateMACD(data, { fast: 8, slow: 21, signal: 5 });

    expect(custom.length).toBeGreaterThan(0);
    expect(custom[0]).toHaveProperty("macd");
  });

  test("throws error with insufficient data", () => {
    const data = [100, 101, 102, 103, 104];
    expect(() => calculateMACD(data)).toThrow("Insufficient data");
  });

  test("positive MACD indicates bullish momentum", () => {
    // Strong uptrend
    const data = Array.from({ length: 50 }, (_, i) => 100 + i * 2);
    const result = calculateMACD(data);

    // In an uptrend, MACD should be positive
    const recentMACD = result[result.length - 1];
    expect(recentMACD.macd).toBeGreaterThan(0);
  });

  test("negative MACD indicates bearish momentum", () => {
    // Strong downtrend
    const data = Array.from({ length: 50 }, (_, i) => 200 - i * 2);
    const result = calculateMACD(data);

    // In a downtrend, MACD should be negative
    const recentMACD = result[result.length - 1];
    expect(recentMACD.macd).toBeLessThan(0);
  });

  test("produces multiple values for long datasets", () => {
    const data = Array.from({ length: 100 }, (_, i) => 100 + Math.random() * 20);
    const result = calculateMACD(data);

    expect(result.length).toBeGreaterThan(10);
  });

  test("MACD line responds faster than signal line", () => {
    // Create data with sudden price jump
    const data = Array.from({ length: 60 }, (_, i) => {
      if (i < 40) return 100;
      return 100 + (i - 40) * 2; // Sudden uptrend
    });

    const result = calculateMACD(data);
    const lastPoint = result[result.length - 1];

    // MACD should be higher than signal in a new uptrend
    // (fast EMA reacts quicker than the signal EMA)
    expect(lastPoint.macd).toBeGreaterThan(lastPoint.signal);
    expect(lastPoint.histogram).toBeGreaterThan(0);
  });
});

describe("detectMACDCrossover", () => {
  test("detects bullish crossover", () => {
    const macdData = [
      { macd: -0.5, signal: 0.2, histogram: -0.7 }, // MACD below Signal
      { macd: 0.3, signal: 0.2, histogram: 0.1 },   // MACD crosses above
    ];

    expect(detectMACDCrossover(macdData)).toBe("bullish");
  });

  test("detects bearish crossover", () => {
    const macdData = [
      { macd: 0.5, signal: 0.2, histogram: 0.3 },   // MACD above Signal
      { macd: 0.1, signal: 0.2, histogram: -0.1 },  // MACD crosses below
    ];

    expect(detectMACDCrossover(macdData)).toBe("bearish");
  });

  test("returns none when no crossover occurs", () => {
    const macdData = [
      { macd: 0.5, signal: 0.2, histogram: 0.3 },
      { macd: 0.6, signal: 0.3, histogram: 0.3 }, // Both increasing, no cross
    ];

    expect(detectMACDCrossover(macdData)).toBe("none");
  });

  test("returns none with insufficient data", () => {
    const macdData = [
      { macd: 0.5, signal: 0.2, histogram: 0.3 },
    ];

    expect(detectMACDCrossover(macdData)).toBe("none");
  });

  test("detects bullish crossover with equal values", () => {
    const macdData = [
      { macd: -0.1, signal: 0.0, histogram: -0.1 },
      { macd: 0.0, signal: 0.0, histogram: 0.0 }, // Equal counts as crossover
    ];

    expect(detectMACDCrossover(macdData)).toBe("bullish");
  });

  test("detects bearish crossover with equal values", () => {
    const macdData = [
      { macd: 0.1, signal: 0.0, histogram: 0.1 },
      { macd: 0.0, signal: 0.0, histogram: 0.0 }, // Equal counts as crossover
    ];

    expect(detectMACDCrossover(macdData)).toBe("bearish");
  });

  test("handles multiple consecutive points without crossover", () => {
    const macdData = [
      { macd: 1.0, signal: 0.5, histogram: 0.5 },
      { macd: 1.1, signal: 0.6, histogram: 0.5 },
      { macd: 1.2, signal: 0.7, histogram: 0.5 },
    ];

    expect(detectMACDCrossover(macdData)).toBe("none");
  });

  test("only considers last two data points", () => {
    const macdData = [
      { macd: 1.0, signal: 0.5, histogram: 0.5 },  // Old data (ignored)
      { macd: -0.2, signal: 0.1, histogram: -0.3 }, // Previous
      { macd: 0.3, signal: 0.1, histogram: 0.2 },   // Current (crossover)
    ];

    expect(detectMACDCrossover(macdData)).toBe("bullish");
  });
});

describe("getMACDSignal", () => {
  test("returns bullish trend when MACD > Signal", () => {
    const macd = { macd: 1.5, signal: 1.0, histogram: 0.5 };
    const result = getMACDSignal(macd);

    expect(result.trend).toBe("bullish");
    expect(result.momentum).toBe("positive");
  });

  test("returns bearish trend when MACD < Signal", () => {
    const macd = { macd: 0.5, signal: 1.0, histogram: -0.5 };
    const result = getMACDSignal(macd);

    expect(result.trend).toBe("bearish");
    expect(result.momentum).toBe("negative");
  });

  test("returns strong strength for large histogram", () => {
    const macd = { macd: 3.0, signal: 1.0, histogram: 2.0 };
    const result = getMACDSignal(macd);

    expect(result.strength).toBe("strong");
  });

  test("returns weak strength for small histogram", () => {
    const macd = { macd: 1.0, signal: 0.8, histogram: 0.2 };
    const result = getMACDSignal(macd);

    expect(result.strength).toBe("weak");
  });

  test("negative histogram means negative momentum", () => {
    const macd = { macd: -1.0, signal: -0.5, histogram: -0.5 };
    const result = getMACDSignal(macd);

    expect(result.momentum).toBe("negative");
  });

  test("positive histogram means positive momentum", () => {
    const macd = { macd: 1.0, signal: 0.5, histogram: 0.5 };
    const result = getMACDSignal(macd);

    expect(result.momentum).toBe("positive");
  });
});

describe("calculateMovingAverages", () => {
  test("calculates single period SMA", () => {
    const data = [10, 20, 30, 40, 50];
    const result = calculateMovingAverages(data, 3);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
    expect(result[0]).toBe(20); // (10+20+30)/3
  });

  test("calculates multiple period SMAs", () => {
    const data = Array.from({ length: 250 }, (_, i) => 100 + i * 0.5);
    const result = calculateMovingAverages(data, [20, 50, 200]);

    expect(result).toHaveProperty("20");
    expect(result).toHaveProperty("50");
    expect(result).toHaveProperty("200");
    expect(typeof result[20]).toBe("number");
    expect(typeof result[50]).toBe("number");
    expect(typeof result[200]).toBe("number");
  });

  test("returns most recent value for each period", () => {
    const data = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const result = calculateMovingAverages(data, [3, 5]);

    // 3-period: avg of last 3 values [18, 19, 20] = 19
    expect(result[3]).toBeCloseTo(19, 1);
    // 5-period: avg of last 5 values [16, 17, 18, 19, 20] = 18
    expect(result[5]).toBeCloseTo(18, 1);
  });

  test("returns null for insufficient data", () => {
    const data = [10, 20, 30, 40, 50];
    const result = calculateMovingAverages(data, [20, 50, 200]);

    expect(result[20]).toBe(null);
    expect(result[50]).toBe(null);
    expect(result[200]).toBe(null);
  });

  test("uses default periods [20, 50, 200]", () => {
    const data = Array.from({ length: 250 }, (_, i) => 100 + i);
    const result = calculateMovingAverages(data);

    expect(result).toHaveProperty("20");
    expect(result).toHaveProperty("50");
    expect(result).toHaveProperty("200");
  });
});

describe("calculateExponentialMovingAverages", () => {
  test("calculates single period EMA", () => {
    const data = Array.from({ length: 30 }, (_, i) => 100 + i);
    const result = calculateExponentialMovingAverages(data, 12);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test("calculates multiple period EMAs", () => {
    const data = Array.from({ length: 50 }, (_, i) => 100 + i * 0.5);
    const result = calculateExponentialMovingAverages(data, [12, 26]);

    expect(result).toHaveProperty("12");
    expect(result).toHaveProperty("26");
    expect(typeof result[12]).toBe("number");
    expect(typeof result[26]).toBe("number");
  });

  test("returns most recent EMA value for each period", () => {
    const data = Array.from({ length: 50 }, (_, i) => 100 + i);
    const result = calculateExponentialMovingAverages(data, [12, 26]);

    expect(result[12]).toBeGreaterThan(100);
    expect(result[26]).toBeGreaterThan(100);
    // 12-period EMA should be higher (reacts faster) in uptrend
    expect(result[12]).toBeGreaterThan(result[26]);
  });

  test("returns null for insufficient data", () => {
    const data = [10, 20, 30, 40, 50];
    const result = calculateExponentialMovingAverages(data, [12, 26]);

    expect(result[12]).toBe(null);
    expect(result[26]).toBe(null);
  });

  test("uses default periods [12, 26]", () => {
    const data = Array.from({ length: 50 }, (_, i) => 100 + i);
    const result = calculateExponentialMovingAverages(data);

    expect(result).toHaveProperty("12");
    expect(result).toHaveProperty("26");
  });
});
