import { describe, test, expect } from "vitest";
import {
  calculateSMA,
  calculateEMA,
  calculateStdDev,
  calculateChanges,
  validateDataLength,
} from "../../../services/indicators/utils.js";

describe("calculateSMA", () => {
  test("calculates simple moving average correctly", () => {
    const data = [10, 20, 30, 40, 50];
    const result = calculateSMA(data, 3);

    expect(result).toEqual([20, 30, 40]);
  });

  test("returns correct length array", () => {
    const data = Array.from({ length: 100 }, (_, i) => i + 1);
    const result = calculateSMA(data, 20);

    expect(result.length).toBe(81); // 100 - 20 + 1
  });

  test("handles period equal to data length", () => {
    const data = [10, 20, 30, 40, 50];
    const result = calculateSMA(data, 5);

    expect(result).toEqual([30]); // Average of all values
  });

  test("throws error when insufficient data", () => {
    const data = [10, 20];
    expect(() => calculateSMA(data, 5)).toThrow("Insufficient data");
  });

  test("throws error for non-array input", () => {
    expect(() => calculateSMA("not an array", 5)).toThrow(
      "Data must be an array"
    );
  });

  test("throws error for invalid numbers", () => {
    const data = [10, 20, NaN, 40];
    expect(() => calculateSMA(data, 3)).toThrow(
      "Data must contain only valid numbers"
    );
  });
});

describe("calculateEMA", () => {
  test("calculates exponential moving average correctly", () => {
    const data = [22, 24, 23, 25, 27, 26, 28, 30];
    const result = calculateEMA(data, 5);

    expect(result.length).toBe(4); // 8 - 5 + 1
    expect(result[0]).toBeCloseTo(24.2, 1); // First value is SMA
    expect(result[result.length - 1]).toBeGreaterThan(result[0]); // Should trend up
  });

  test("gives more weight to recent prices than SMA", () => {
    const data = [10, 10, 10, 10, 10, 20]; // Sudden price jump
    const sma = calculateSMA(data, 5);
    const ema = calculateEMA(data, 5);

    // EMA should react more to the recent price change
    expect(ema[ema.length - 1]).toBeGreaterThan(sma[sma.length - 1]);
  });

  test("handles minimum period of 2", () => {
    const data = [10, 20, 30];
    const result = calculateEMA(data, 2);

    expect(result.length).toBe(2);
  });

  test("throws error when insufficient data", () => {
    const data = [10, 20];
    expect(() => calculateEMA(data, 5)).toThrow("Insufficient data");
  });
});

describe("calculateStdDev", () => {
  test("calculates standard deviation correctly", () => {
    // Data with known standard deviation
    const data = [2, 4, 4, 4, 5, 5, 7, 9];
    const result = calculateStdDev(data, 8);

    expect(result.length).toBe(1);
    expect(result[0]).toBeCloseTo(2.0, 1); // Known std dev ≈ 2.0
  });

  test("returns zero for constant values", () => {
    const data = [5, 5, 5, 5, 5];
    const result = calculateStdDev(data, 5);

    expect(result[0]).toBe(0);
  });

  test("calculates rolling standard deviation", () => {
    const data = [10, 12, 11, 13, 15, 14, 16, 18];
    const result = calculateStdDev(data, 3);

    expect(result.length).toBe(6);
    // Each value should be positive (prices vary)
    result.forEach((val) => expect(val).toBeGreaterThan(0));
  });

  test("higher volatility produces higher std dev", () => {
    const stable = [10, 11, 10, 11, 10];
    const volatile = [10, 20, 5, 25, 3];

    const stableStdDev = calculateStdDev(stable, 5);
    const volatileStdDev = calculateStdDev(volatile, 5);

    expect(volatileStdDev[0]).toBeGreaterThan(stableStdDev[0]);
  });

  test("throws error when insufficient data", () => {
    const data = [10, 20];
    expect(() => calculateStdDev(data, 5)).toThrow("Insufficient data");
  });
});

describe("calculateChanges", () => {
  test("calculates price changes correctly", () => {
    const data = [10, 12, 11, 14, 13];
    const result = calculateChanges(data);

    expect(result).toEqual([2, -1, 3, -1]);
  });

  test("returns array one element shorter than input", () => {
    const data = [100, 101, 102, 103, 104, 105];
    const result = calculateChanges(data);

    expect(result.length).toBe(5);
  });

  test("handles negative changes", () => {
    const data = [50, 45, 40];
    const result = calculateChanges(data);

    expect(result).toEqual([-5, -5]);
  });

  test("handles zero changes", () => {
    const data = [100, 100, 100];
    const result = calculateChanges(data);

    expect(result).toEqual([0, 0]);
  });

  test("handles decimal values", () => {
    const data = [10.5, 11.2, 10.8];
    const result = calculateChanges(data);

    expect(result[0]).toBeCloseTo(0.7, 1);
    expect(result[1]).toBeCloseTo(-0.4, 1);
  });

  test("throws error with insufficient data", () => {
    const data = [10];
    expect(() => calculateChanges(data)).toThrow(
      "Need at least 2 data points to calculate changes"
    );
  });

  test("throws error with non-array input", () => {
    expect(() => calculateChanges("not an array")).toThrow(
      "Need at least 2 data points to calculate changes"
    );
  });
});

describe("validateDataLength", () => {
  test("passes validation with sufficient data", () => {
    const data = [1, 2, 3, 4, 5];
    expect(() => validateDataLength(data, 5)).not.toThrow();
  });

  test("passes validation with more than required data", () => {
    const data = [1, 2, 3, 4, 5, 6, 7];
    expect(() => validateDataLength(data, 5)).not.toThrow();
  });

  test("throws error with insufficient data", () => {
    const data = [1, 2, 3];
    expect(() => validateDataLength(data, 5)).toThrow(
      "Insufficient data: need 5 points, got 3"
    );
  });

  test("throws error for non-array input", () => {
    expect(() => validateDataLength("not an array", 5)).toThrow(
      "Data must be an array"
    );
  });

  test("throws error for invalid numbers", () => {
    const data = [1, 2, "three", 4];
    expect(() => validateDataLength(data, 4)).toThrow(
      "Data must contain only valid numbers"
    );
  });

  test("throws error for NaN values", () => {
    const data = [1, 2, NaN, 4];
    expect(() => validateDataLength(data, 4)).toThrow(
      "Data must contain only valid numbers"
    );
  });
});
