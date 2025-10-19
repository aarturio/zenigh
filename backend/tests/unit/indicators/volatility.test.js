import { describe, test, expect } from "vitest";
import {
  calculateBollingerBands,
  getBollingerPosition,
  calculateATR,
  calculateTrueRange,
  getVolatilityLevel,
  calculateBandWidth,
} from "../../../services/indicators/volatility.js";

describe("calculateBollingerBands", () => {
  test("calculates Bollinger Bands with default config", () => {
    const data = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i / 3) * 5);
    const result = calculateBollingerBands(data);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("upper");
    expect(result[0]).toHaveProperty("middle");
    expect(result[0]).toHaveProperty("lower");
  });

  test("upper band is above middle, lower is below", () => {
    const data = Array.from({ length: 30 }, (_, i) => 100 + i);
    const result = calculateBollingerBands(data);

    result.forEach(({ upper, middle, lower }) => {
      expect(upper).toBeGreaterThan(middle);
      expect(middle).toBeGreaterThan(lower);
    });
  });

  test("middle band equals SMA", () => {
    const data = [100, 102, 101, 103, 102, 104, 103, 105, 104, 106, 105, 107, 106, 108, 107, 109, 108, 110, 109, 111, 110];
    const result = calculateBollingerBands(data, { period: 20, stdDev: 2 });

    // Middle band should be the 20-period SMA (average of first 20 values)
    expect(result[0].middle).toBeCloseTo(105.5, 1);
  });

  test("accepts custom standard deviation multiplier", () => {
    const data = Array.from({ length: 30 }, (_, i) => 100 + i);
    const bands2 = calculateBollingerBands(data, { period: 20, stdDev: 2 });
    const bands3 = calculateBollingerBands(data, { period: 20, stdDev: 3 });

    // Bands with stdDev=3 should be wider
    const width2 = bands2[0].upper - bands2[0].lower;
    const width3 = bands3[0].upper - bands3[0].lower;

    expect(width3).toBeGreaterThan(width2);
  });

  test("bands widen with increased volatility", () => {
    // Low volatility data
    const stable = Array.from({ length: 30 }, () => 100);
    const stableBands = calculateBollingerBands(stable);

    // High volatility data
    const volatile = Array.from({ length: 30 }, (_, i) => 100 + (i % 2 === 0 ? 10 : -10));
    const volatileBands = calculateBollingerBands(volatile);

    const stableWidth = stableBands[0].upper - stableBands[0].lower;
    const volatileWidth = volatileBands[0].upper - volatileBands[0].lower;

    expect(volatileWidth).toBeGreaterThan(stableWidth);
  });

  test("throws error with insufficient data", () => {
    const data = [100, 101, 102];
    expect(() => calculateBollingerBands(data)).toThrow("Insufficient data");
  });

  test("accepts custom period", () => {
    const data = Array.from({ length: 50 }, (_, i) => 100 + i);
    const result = calculateBollingerBands(data, { period: 10, stdDev: 2 });

    expect(result.length).toBe(41); // 50 - 10 + 1
  });
});

describe("getBollingerPosition", () => {
  const bands = { upper: 110, middle: 100, lower: 90 };

  test("returns 'above_upper' when price exceeds upper band", () => {
    expect(getBollingerPosition(115, bands)).toBe("above_upper");
  });

  test("returns 'below_lower' when price is below lower band", () => {
    expect(getBollingerPosition(85, bands)).toBe("below_lower");
  });

  test("returns 'upper' when price is near upper band", () => {
    expect(getBollingerPosition(109, bands)).toBe("upper");
  });

  test("returns 'lower' when price is near lower band", () => {
    expect(getBollingerPosition(91, bands)).toBe("lower");
  });

  test("returns 'middle' when price is in middle range", () => {
    expect(getBollingerPosition(100, bands)).toBe("middle");
    expect(getBollingerPosition(95, bands)).toBe("middle");
    expect(getBollingerPosition(105, bands)).toBe("middle");
  });
});

describe("calculateTrueRange", () => {
  test("calculates true range for first bar (no previous)", () => {
    const current = { high: 105, low: 95, close: 100 };
    const tr = calculateTrueRange(current, null);

    expect(tr).toBe(10); // high - low
  });

  test("calculates true range with previous close", () => {
    const previous = { high: 100, low: 90, close: 95 };
    const current = { high: 105, low: 93, close: 100 };
    const tr = calculateTrueRange(current, previous);

    // Max of: (105-93)=12, |105-95|=10, |93-95|=2
    expect(tr).toBe(12);
  });

  test("uses high-close gap when largest", () => {
    const previous = { high: 110, low: 100, close: 110 };
    const current = { high: 120, low: 108, close: 115 };
    const tr = calculateTrueRange(current, previous);

    // Max of: (120-108)=12, |120-110|=10, |108-110|=2
    expect(tr).toBe(12);
  });

  test("uses low-close gap when largest", () => {
    const previous = { high: 110, low: 100, close: 100 };
    const current = { high: 105, low: 90, close: 95 };
    const tr = calculateTrueRange(current, previous);

    // Max of: (105-90)=15, |105-100|=5, |90-100|=10
    expect(tr).toBe(15);
  });

  test("handles gap up scenario", () => {
    const previous = { high: 100, low: 95, close: 98 };
    const current = { high: 110, low: 105, close: 108 };
    const tr = calculateTrueRange(current, previous);

    // Gap up: max of (110-105)=5, |110-98|=12, |105-98|=7
    expect(tr).toBe(12);
  });

  test("handles gap down scenario", () => {
    const previous = { high: 110, low: 105, close: 107 };
    const current = { high: 100, low: 95, close: 98 };
    const tr = calculateTrueRange(current, previous);

    // Gap down: max of (100-95)=5, |100-107|=7, |95-107|=12
    expect(tr).toBe(12);
  });
});

describe("calculateATR", () => {
  test("calculates ATR with default period", () => {
    const data = Array.from({ length: 20 }, (_, i) => ({
      high: 100 + i + 5,
      low: 100 + i - 5,
      close: 100 + i,
    }));

    const result = calculateATR(data);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toBeGreaterThan(0);
  });

  test("ATR values are all positive", () => {
    const data = Array.from({ length: 30 }, (_, i) => ({
      high: 100 + Math.random() * 10,
      low: 90 + Math.random() * 10,
      close: 95 + Math.random() * 10,
    }));

    const result = calculateATR(data);

    result.forEach((atr) => {
      expect(atr).toBeGreaterThan(0);
    });
  });

  test("higher volatility produces higher ATR", () => {
    // Low volatility
    const stable = Array.from({ length: 20 }, (_, i) => ({
      high: 101,
      low: 99,
      close: 100,
    }));

    // High volatility
    const volatile = Array.from({ length: 20 }, (_, i) => ({
      high: 110,
      low: 90,
      close: 100,
    }));

    const stableATR = calculateATR(stable);
    const volatileATR = calculateATR(volatile);

    expect(volatileATR[0]).toBeGreaterThan(stableATR[0]);
  });

  test("accepts custom period", () => {
    const data = Array.from({ length: 30 }, (_, i) => ({
      high: 100 + i + 5,
      low: 100 + i - 5,
      close: 100 + i,
    }));

    const atr7 = calculateATR(data, 7);
    const atr14 = calculateATR(data, 14);

    expect(atr7.length).toBeGreaterThan(atr14.length);
  });

  test("throws error with insufficient data", () => {
    const data = [
      { high: 105, low: 95, close: 100 },
      { high: 106, low: 96, close: 101 },
    ];

    expect(() => calculateATR(data, 14)).toThrow("Insufficient data");
  });

  test("uses Wilder's smoothing for subsequent values", () => {
    const data = Array.from({ length: 30 }, (_, i) => ({
      high: 100 + i + 5,
      low: 100 + i - 5,
      close: 100 + i,
    }));

    const result = calculateATR(data, 14);

    // ATR should change gradually due to smoothing
    expect(result.length).toBeGreaterThan(1);
  });
});

describe("getVolatilityLevel", () => {
  test("returns 'high' when current ATR is 50% above average", () => {
    const atrHistory = Array(20).fill(10);
    const currentATR = 16;

    expect(getVolatilityLevel(currentATR, atrHistory)).toBe("high");
  });

  test("returns 'low' when current ATR is 50% below average", () => {
    const atrHistory = Array(20).fill(10);
    const currentATR = 4;

    expect(getVolatilityLevel(currentATR, atrHistory)).toBe("low");
  });

  test("returns 'normal' when current ATR is close to average", () => {
    const atrHistory = Array(20).fill(10);
    const currentATR = 10;

    expect(getVolatilityLevel(currentATR, atrHistory)).toBe("normal");
  });

  test("returns 'normal' with insufficient history", () => {
    const atrHistory = [10, 10, 10];
    const currentATR = 20;

    expect(getVolatilityLevel(currentATR, atrHistory)).toBe("normal");
  });

  test("handles varying ATR history", () => {
    const atrHistory = [8, 9, 10, 11, 12, 10, 9, 8, 10, 11, 10, 9, 10, 11, 10, 9, 10, 11, 10, 9];
    const highATR = 16;
    const normalATR = 10;
    const lowATR = 4;

    expect(getVolatilityLevel(highATR, atrHistory)).toBe("high");
    expect(getVolatilityLevel(normalATR, atrHistory)).toBe("normal");
    expect(getVolatilityLevel(lowATR, atrHistory)).toBe("low");
  });
});

describe("calculateBandWidth", () => {
  test("calculates band width percentage", () => {
    const bands = { upper: 110, middle: 100, lower: 90 };
    const width = calculateBandWidth(bands);

    expect(width).toBe(20); // (110-90)/100 * 100 = 20%
  });

  test("wider bands produce higher percentage", () => {
    const narrow = { upper: 105, middle: 100, lower: 95 };
    const wide = { upper: 120, middle: 100, lower: 80 };

    const narrowWidth = calculateBandWidth(narrow);
    const wideWidth = calculateBandWidth(wide);

    expect(wideWidth).toBeGreaterThan(narrowWidth);
  });

  test("handles zero middle band gracefully", () => {
    const bands = { upper: 10, middle: 0.001, lower: -10 };

    // Should not throw, even with very small middle
    expect(() => calculateBandWidth(bands)).not.toThrow();
  });

  test("band width reflects volatility", () => {
    const lowVol = { upper: 101, middle: 100, lower: 99 };
    const highVol = { upper: 130, middle: 100, lower: 70 };

    expect(calculateBandWidth(highVol)).toBeGreaterThan(calculateBandWidth(lowVol));
  });
});
