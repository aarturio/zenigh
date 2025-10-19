import { describe, test, expect } from "vitest";
import {
  calculateVolumeMA,
  calculateOBV,
  analyzeVolume,
  detectVolumeSpikes,
  getVolumeTrend,
  getVolumeConfirmation,
} from "../../../services/indicators/volume.js";

describe("calculateVolumeMA", () => {
  test("calculates single period volume MA", () => {
    const volumeData = [1000, 1200, 1100, 1300, 1250];
    const result = calculateVolumeMA(volumeData, 3);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
    expect(result[0]).toBeCloseTo(1100, 0); // (1000+1200+1100)/3
  });

  test("calculates multiple period volume MAs", () => {
    const volumeData = Array.from({ length: 60 }, (_, i) => 1000 + i * 10);
    const result = calculateVolumeMA(volumeData, [20, 50]);

    expect(result).toHaveProperty("20");
    expect(result).toHaveProperty("50");
    expect(typeof result[20]).toBe("number");
    expect(typeof result[50]).toBe("number");
  });

  test("returns most recent value for each period", () => {
    const volumeData = [1000, 1100, 1200, 1300, 1400, 1500];
    const result = calculateVolumeMA(volumeData, [3]);

    // Last 3: [1300, 1400, 1500] = 1400
    expect(result[3]).toBeCloseTo(1400, 0);
  });

  test("returns null for insufficient data", () => {
    const volumeData = [1000, 1100, 1200];
    const result = calculateVolumeMA(volumeData, [20, 50]);

    expect(result[20]).toBe(null);
    expect(result[50]).toBe(null);
  });

  test("uses default periods [20, 50]", () => {
    const volumeData = Array.from({ length: 60 }, (_, i) => 1000 + i);
    const result = calculateVolumeMA(volumeData);

    expect(result).toHaveProperty("20");
    expect(result).toHaveProperty("50");
  });
});

describe("calculateOBV", () => {
  test("calculates OBV correctly", () => {
    const data = [
      { close: 100, volume: 1000 },
      { close: 102, volume: 1200 }, // Price up: +1200
      { close: 101, volume: 1100 }, // Price down: -1100
      { close: 103, volume: 1300 }, // Price up: +1300
    ];

    const result = calculateOBV(data);

    expect(result.length).toBe(4);
    expect(result[0]).toBe(1000); // Initial
    expect(result[1]).toBe(2200); // 1000 + 1200
    expect(result[2]).toBe(1100); // 2200 - 1100
    expect(result[3]).toBe(2400); // 1100 + 1300
  });

  test("OBV is cumulative", () => {
    const data = [
      { close: 100, volume: 1000 },
      { close: 101, volume: 500 },
      { close: 102, volume: 500 },
      { close: 103, volume: 500 },
    ];

    const result = calculateOBV(data);

    expect(result[result.length - 1]).toBe(2500); // Cumulative sum
  });

  test("OBV unchanged when price unchanged", () => {
    const data = [
      { close: 100, volume: 1000 },
      { close: 100, volume: 1200 }, // Price same
      { close: 101, volume: 1100 },
    ];

    const result = calculateOBV(data);

    expect(result[1]).toBe(result[0]); // No change
    expect(result[2]).toBe(result[1] + 1100); // Then increase
  });

  test("OBV decreases on down days", () => {
    const data = [
      { close: 105, volume: 1000 },
      { close: 104, volume: 500 },
      { close: 103, volume: 500 },
    ];

    const result = calculateOBV(data);

    expect(result[1]).toBe(500); // 1000 - 500
    expect(result[2]).toBe(0); // 500 - 500
  });

  test("OBV can be negative", () => {
    const data = [
      { close: 100, volume: 100 },
      { close: 99, volume: 200 },
      { close: 98, volume: 300 },
    ];

    const result = calculateOBV(data);

    expect(result[result.length - 1]).toBeLessThan(0);
  });

  test("throws error with insufficient data", () => {
    const data = [{ close: 100, volume: 1000 }];
    expect(() => calculateOBV(data)).toThrow("Need at least 2 data points");
  });

  test("handles large datasets", () => {
    const data = Array.from({ length: 100 }, (_, i) => ({
      close: 100 + (i % 2 === 0 ? 1 : -1),
      volume: 1000,
    }));

    const result = calculateOBV(data);

    expect(result.length).toBe(100);
  });
});

describe("analyzeVolume", () => {
  test("returns 'extremely_high' for 2x average volume", () => {
    const result = analyzeVolume(2000, 1000);

    expect(result.level).toBe("extremely_high");
    expect(result.ratio).toBe(2.0);
    expect(result.aboveAverage).toBe(true);
  });

  test("returns 'high' for 1.5x average volume", () => {
    const result = analyzeVolume(1500, 1000);

    expect(result.level).toBe("high");
    expect(result.ratio).toBe(1.5);
  });

  test("returns 'normal' for average volume", () => {
    const result = analyzeVolume(1000, 1000);

    expect(result.level).toBe("normal");
    expect(result.ratio).toBe(1.0);
  });

  test("returns 'low' for 0.6x average volume", () => {
    const result = analyzeVolume(600, 1000);

    expect(result.level).toBe("low");
    expect(result.ratio).toBe(0.6);
  });

  test("returns 'extremely_low' for 0.4x average volume", () => {
    const result = analyzeVolume(400, 1000);

    expect(result.level).toBe("extremely_low");
    expect(result.ratio).toBe(0.4);
  });

  test("includes percentage of average", () => {
    const result = analyzeVolume(1500, 1000);

    expect(result.percentageOfAverage).toBe("150.00");
  });

  test("aboveAverage is false when below average", () => {
    const result = analyzeVolume(800, 1000);

    expect(result.aboveAverage).toBe(false);
  });
});

describe("detectVolumeSpikes", () => {
  test("detects volume spikes above threshold", () => {
    const volumeData = Array(25).fill(1000);
    volumeData[22] = 2500; // Spike at index 22

    const spikes = detectVolumeSpikes(volumeData, 2.0);

    expect(spikes).toContain(22);
  });

  test("returns empty array with insufficient data", () => {
    const volumeData = [1000, 1100, 1200];
    const spikes = detectVolumeSpikes(volumeData);

    expect(spikes).toEqual([]);
  });

  test("detects multiple spikes", () => {
    const volumeData = Array(30).fill(1000);
    volumeData[22] = 2500;
    volumeData[25] = 3000;
    volumeData[28] = 2200;

    const spikes = detectVolumeSpikes(volumeData, 2.0);

    expect(spikes.length).toBeGreaterThanOrEqual(2);
    expect(spikes).toContain(22);
    expect(spikes).toContain(25);
  });

  test("accepts custom threshold", () => {
    const volumeData = Array(25).fill(1000);
    volumeData[22] = 1600; // 1.6x average

    const spikes2x = detectVolumeSpikes(volumeData, 2.0);
    const spikes1_5x = detectVolumeSpikes(volumeData, 1.5);

    expect(spikes2x).not.toContain(22); // Below 2x threshold
    expect(spikes1_5x).toContain(22); // Above 1.5x threshold
  });

  test("only checks after initial period", () => {
    const volumeData = Array(25).fill(1000);
    volumeData[10] = 5000; // Early spike (before period 20)

    const spikes = detectVolumeSpikes(volumeData, 2.0);

    expect(spikes).not.toContain(10);
  });
});

describe("getVolumeTrend", () => {
  test("returns 'rising' for increasing OBV", () => {
    const obvData = [1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900];
    const trend = getVolumeTrend(obvData, 10);

    expect(trend).toBe("rising");
  });

  test("returns 'falling' for decreasing OBV", () => {
    const obvData = [1900, 1800, 1700, 1600, 1500, 1400, 1300, 1200, 1100, 1000];
    const trend = getVolumeTrend(obvData, 10);

    expect(trend).toBe("falling");
  });

  test("returns 'flat' for stable OBV", () => {
    const obvData = Array(10).fill(1000);
    const trend = getVolumeTrend(obvData, 10);

    expect(trend).toBe("flat");
  });

  test("returns 'flat' with insufficient data", () => {
    const obvData = [1000, 1100, 1200];
    const trend = getVolumeTrend(obvData, 10);

    expect(trend).toBe("flat");
  });

  test("uses custom lookback period", () => {
    const obvData = [1000, 1100, 1200, 1300, 1400];
    const trend = getVolumeTrend(obvData, 5);

    expect(trend).toBe("rising");
  });

  test("detects subtle trends", () => {
    // 7% increase over 10 periods
    const obvData = [1000, 1010, 1020, 1030, 1040, 1050, 1060, 1070, 1080, 1090];
    const trend = getVolumeTrend(obvData, 10);

    expect(trend).toBe("rising");
  });
});

describe("getVolumeConfirmation", () => {
  test("returns 'strong_bullish' for price up with high volume", () => {
    const priceData = { current: 105, previous: 100 };
    const volumeData = { current: 2000, average: 1000 };

    const result = getVolumeConfirmation(priceData, volumeData);

    expect(result.confirmation).toBe("strong_bullish");
    expect(result.volumeSupported).toBe(true);
  });

  test("returns 'weak_bullish' for price up with low volume", () => {
    const priceData = { current: 105, previous: 100 };
    const volumeData = { current: 800, average: 1000 };

    const result = getVolumeConfirmation(priceData, volumeData);

    expect(result.confirmation).toBe("weak_bullish");
    expect(result.volumeSupported).toBe(false);
  });

  test("returns 'strong_bearish' for price down with high volume", () => {
    const priceData = { current: 95, previous: 100 };
    const volumeData = { current: 2000, average: 1000 };

    const result = getVolumeConfirmation(priceData, volumeData);

    expect(result.confirmation).toBe("strong_bearish");
    expect(result.volumeSupported).toBe(true);
  });

  test("returns 'weak_bearish' for price down with low volume", () => {
    const priceData = { current: 95, previous: 100 };
    const volumeData = { current: 800, average: 1000 };

    const result = getVolumeConfirmation(priceData, volumeData);

    expect(result.confirmation).toBe("weak_bearish");
    expect(result.volumeSupported).toBe(false);
  });

  test("handles equal prices", () => {
    const priceData = { current: 100, previous: 100 };
    const volumeData = { current: 1500, average: 1000 };

    const result = getVolumeConfirmation(priceData, volumeData);

    expect(result.confirmation).toBe("strong_bearish"); // Not priceUp, so bearish
  });

  test("volumeSupported is true for high volume moves", () => {
    const bullish = getVolumeConfirmation(
      { current: 105, previous: 100 },
      { current: 2000, average: 1000 }
    );

    const bearish = getVolumeConfirmation(
      { current: 95, previous: 100 },
      { current: 2000, average: 1000 }
    );

    expect(bullish.volumeSupported).toBe(true);
    expect(bearish.volumeSupported).toBe(true);
  });

  test("volumeSupported is false for low volume moves", () => {
    const bullish = getVolumeConfirmation(
      { current: 105, previous: 100 },
      { current: 500, average: 1000 }
    );

    const bearish = getVolumeConfirmation(
      { current: 95, previous: 100 },
      { current: 500, average: 1000 }
    );

    expect(bullish.volumeSupported).toBe(false);
    expect(bearish.volumeSupported).toBe(false);
  });
});
