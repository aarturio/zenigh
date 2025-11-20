import { describe, it, expect } from "vitest";

import StreamService from "../stream/stream-service.js";

describe("StreamService", () => {
  describe("liveToFrontend", () => {
    it("should transform Alpaca bar to frontend format", () => {
      const alpacaBar = {
        t: "2024-01-01T10:00:00Z",
        c: 150.5,
        o: 150.0,
        h: 151.0,
        l: 149.5,
        v: 1000000,
      };

      const result = StreamService.liveToFrontend(alpacaBar);

      expect(result).toEqual({
        time: new Date("2024-01-01T10:00:00Z").getTime() / 1000,
        value: 150.5,
      });
    });

    it("should convert timestamp from milliseconds to seconds", () => {
      const alpacaBar = {
        t: "2024-01-01T00:00:00Z",
        c: 100,
      };

      const result = StreamService.liveToFrontend(alpacaBar);

      // Unix timestamp in seconds (not milliseconds)
      expect(result.time).toBe(1704067200);
      expect(result.time).not.toBe(1704067200000);
    });

    it("should extract close price as value", () => {
      const alpacaBar = {
        t: "2024-01-01T10:00:00Z",
        c: 175.25,
        o: 170.0,
        h: 180.0,
        l: 169.0,
      };

      const result = StreamService.liveToFrontend(alpacaBar);

      expect(result.value).toBe(175.25);
    });

    it("should handle different timestamp formats", () => {
      const testCases = [
        {
          input: "2024-01-15T14:30:00Z",
          expected: new Date("2024-01-15T14:30:00Z").getTime() / 1000,
        },
        {
          input: "2024-12-31T23:59:59Z",
          expected: new Date("2024-12-31T23:59:59Z").getTime() / 1000,
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const alpacaBar = { t: input, c: 100 };
        const result = StreamService.liveToFrontend(alpacaBar);
        expect(result.time).toBe(expected);
      });
    });

    it("should handle decimal prices correctly", () => {
      const alpacaBar = {
        t: "2024-01-01T10:00:00Z",
        c: 123.456789,
      };

      const result = StreamService.liveToFrontend(alpacaBar);

      expect(result.value).toBe(123.456789);
    });

    it("should only include time and value fields", () => {
      const alpacaBar = {
        t: "2024-01-01T10:00:00Z",
        c: 150.0,
        o: 149.0,
        h: 151.0,
        l: 148.0,
        v: 1000000,
        extra: "should not appear",
      };

      const result = StreamService.liveToFrontend(alpacaBar);

      expect(Object.keys(result)).toEqual(["time", "value"]);
      expect(result.extra).toBeUndefined();
    });
  });

  describe("dbToFrontend", () => {
    it("should transform database bars to frontend format", () => {
      const dbRecords = [
        {
          symbol: "AAPL",
          timestamp: new Date("2024-01-01T10:00:00Z"),
          close: "150.5000",
          open: "150.0000",
          high: "151.0000",
          low: "149.5000",
          volume: "1000000",
        },
        {
          symbol: "AAPL",
          timestamp: new Date("2024-01-02T10:00:00Z"),
          close: "151.0000",
          open: "150.5000",
          high: "151.5000",
          low: "150.0000",
          volume: "1100000",
        },
      ];

      const taRecords = [];

      const result = StreamService.dbToFrontend(dbRecords, taRecords);

      expect(result.bars).toHaveLength(2);
      expect(result.bars[0]).toEqual({
        value: "150.5000",
        time: new Date("2024-01-01T10:00:00Z").getTime() / 1000,
      });
      expect(result.bars[1]).toEqual({
        value: "151.0000",
        time: new Date("2024-01-02T10:00:00Z").getTime() / 1000,
      });
    });

    it("should convert database timestamps to seconds", () => {
      const dbRecords = [
        {
          timestamp: new Date("2024-01-01T10:00:00Z"),
          close: "150.0",
        },
      ];

      const result = StreamService.dbToFrontend(dbRecords, []);

      expect(result.bars[0].time).toBe(1704103200); // Seconds
      expect(result.bars[0].time).not.toBe(1704103200000); // Not milliseconds
    });

    it("should extract SMA indicators from TA records", () => {
      const dbRecords = [
        {
          timestamp: new Date("2024-01-01T10:00:00Z"),
          close: "150.0",
        },
      ];

      const taRecords = [
        {
          timestamp: new Date("2024-01-01T10:00:00Z"),
          indicators: {
            trend: {
              sma: {
                5: 148.5,
                20: 147.0,
              },
            },
          },
        },
      ];

      const result = StreamService.dbToFrontend(dbRecords, taRecords);

      expect(result.indicators.sma5).toHaveLength(1);
      expect(result.indicators.sma5[0]).toEqual({
        time: new Date("2024-01-01T10:00:00Z").getTime() / 1000,
        value: 148.5,
      });

      expect(result.indicators.sma20).toHaveLength(1);
      expect(result.indicators.sma20[0].value).toBe(147.0);
    });

    it("should extract EMA indicators from TA records", () => {
      const dbRecords = [
        {
          timestamp: new Date("2024-01-01T10:00:00Z"),
          close: "150.0",
        },
      ];

      const taRecords = [
        {
          timestamp: new Date("2024-01-01T10:00:00Z"),
          indicators: {
            trend: {
              ema: {
                5: 149.0,
                20: 148.0,
              },
            },
          },
        },
      ];

      const result = StreamService.dbToFrontend(dbRecords, taRecords);

      expect(result.indicators.ema5).toHaveLength(1);
      expect(result.indicators.ema5[0].value).toBe(149.0);

      expect(result.indicators.ema20).toHaveLength(1);
      expect(result.indicators.ema20[0].value).toBe(148.0);
    });

    it("should handle multiple TA records with all SMA periods", () => {
      const dbRecords = [
        { timestamp: new Date("2024-01-01T10:00:00Z"), close: "150.0" },
      ];

      const taRecords = [
        {
          timestamp: new Date("2024-01-01T10:00:00Z"),
          indicators: {
            trend: {
              sma: {
                5: 150.1,
                8: 150.2,
                10: 150.3,
                13: 150.4,
                20: 150.5,
                34: 150.6,
                50: 150.7,
                100: 150.8,
                150: 150.9,
                200: 151.0,
              },
            },
          },
        },
      ];

      const result = StreamService.dbToFrontend(dbRecords, taRecords);

      // Check all SMA periods exist
      const expectedSMAs = {
        5: 150.1,
        8: 150.2,
        10: 150.3,
        13: 150.4,
        20: 150.5,
        34: 150.6,
        50: 150.7,
        100: 150.8,
        150: 150.9,
        200: 151.0,
      };

      Object.entries(expectedSMAs).forEach(([period, expectedValue]) => {
        const key = `sma${period}`;
        expect(result.indicators[key]).toHaveLength(1);
        expect(result.indicators[key][0].value).toBe(expectedValue);
      });
    });

    it("should handle multiple TA records with all EMA periods", () => {
      const dbRecords = [
        { timestamp: new Date("2024-01-01T10:00:00Z"), close: "150.0" },
      ];

      const taRecords = [
        {
          timestamp: new Date("2024-01-01T10:00:00Z"),
          indicators: {
            trend: {
              ema: {
                5: 151.1,
                8: 151.2,
                10: 151.3,
                13: 151.4,
                20: 151.5,
                34: 151.6,
                50: 151.7,
                100: 151.8,
                150: 151.9,
                200: 152.0,
              },
            },
          },
        },
      ];

      const result = StreamService.dbToFrontend(dbRecords, taRecords);

      // Check all EMA periods exist
      const expectedEMAs = {
        5: 151.1,
        8: 151.2,
        10: 151.3,
        13: 151.4,
        20: 151.5,
        34: 151.6,
        50: 151.7,
        100: 151.8,
        150: 151.9,
        200: 152.0,
      };

      Object.entries(expectedEMAs).forEach(([period, expectedValue]) => {
        const key = `ema${period}`;
        expect(result.indicators[key]).toHaveLength(1);
        expect(result.indicators[key][0].value).toBe(expectedValue);
      });
    });

    it("should filter out null indicator values", () => {
      const dbRecords = [
        { timestamp: new Date("2024-01-01T10:00:00Z"), close: "150.0" },
        { timestamp: new Date("2024-01-02T10:00:00Z"), close: "151.0" },
      ];

      const taRecords = [
        {
          timestamp: new Date("2024-01-01T10:00:00Z"),
          indicators: {
            trend: {
              sma: {
                5: null, // Should be filtered out
                20: 147.0,
              },
            },
          },
        },
        {
          timestamp: new Date("2024-01-02T10:00:00Z"),
          indicators: {
            trend: {
              sma: {
                5: 148.5,
                20: 147.5,
              },
            },
          },
        },
      ];

      const result = StreamService.dbToFrontend(dbRecords, taRecords);

      // sma5 should only have 1 record (null filtered out)
      expect(result.indicators.sma5).toHaveLength(1);
      expect(result.indicators.sma5[0].value).toBe(148.5);

      // sma20 should have 2 records
      expect(result.indicators.sma20).toHaveLength(2);
    });

    it("should handle empty database records", () => {
      const result = StreamService.dbToFrontend([], []);

      expect(result.bars).toEqual([]);
      // Indicators object should have all keys but empty arrays
      expect(result.indicators).toBeDefined();
      Object.values(result.indicators).forEach((indicatorArray) => {
        expect(indicatorArray).toEqual([]);
      });
    });

    it("should handle empty TA records", () => {
      const dbRecords = [
        { timestamp: new Date("2024-01-01T10:00:00Z"), close: "150.0" },
      ];

      const result = StreamService.dbToFrontend(dbRecords, []);

      expect(result.bars).toHaveLength(1);
      // All indicator arrays should be empty
      Object.values(result.indicators).forEach((indicatorArray) => {
        expect(indicatorArray).toEqual([]);
      });
    });

    it("should handle missing indicator categories gracefully", () => {
      const dbRecords = [
        { timestamp: new Date("2024-01-01T10:00:00Z"), close: "150.0" },
      ];

      const taRecords = [
        {
          timestamp: new Date("2024-01-01T10:00:00Z"),
          indicators: {
            // Missing 'trend' category
            momentum: {
              rsi: { value: 60 },
            },
          },
        },
      ];

      const result = StreamService.dbToFrontend(dbRecords, taRecords);

      // Should not throw, indicators should be empty arrays
      expect(result.bars).toHaveLength(1);
      expect(result.indicators.sma5).toEqual([]);
      expect(result.indicators.ema20).toEqual([]);
    });

    it("should handle TA records without indicators field", () => {
      const dbRecords = [
        { timestamp: new Date("2024-01-01T10:00:00Z"), close: "150.0" },
      ];

      const taRecords = [
        {
          timestamp: new Date("2024-01-01T10:00:00Z"),
          // Missing 'indicators' field entirely
        },
      ];

      const result = StreamService.dbToFrontend(dbRecords, taRecords);

      expect(result.bars).toHaveLength(1);
      expect(result.indicators.sma5).toEqual([]);
    });

    it("should maintain chronological order", () => {
      const dbRecords = [
        { timestamp: new Date("2024-01-01T10:00:00Z"), close: "150.0" },
        { timestamp: new Date("2024-01-02T10:00:00Z"), close: "151.0" },
        { timestamp: new Date("2024-01-03T10:00:00Z"), close: "152.0" },
      ];

      const taRecords = [
        {
          timestamp: new Date("2024-01-01T10:00:00Z"),
          indicators: { trend: { sma: { 20: 147.0 } } },
        },
        {
          timestamp: new Date("2024-01-02T10:00:00Z"),
          indicators: { trend: { sma: { 20: 148.0 } } },
        },
        {
          timestamp: new Date("2024-01-03T10:00:00Z"),
          indicators: { trend: { sma: { 20: 149.0 } } },
        },
      ];

      const result = StreamService.dbToFrontend(dbRecords, taRecords);

      // Verify bars are in order
      expect(result.bars[0].value).toBe("150.0");
      expect(result.bars[1].value).toBe("151.0");
      expect(result.bars[2].value).toBe("152.0");

      // Verify indicators are in order
      expect(result.indicators.sma20[0].value).toBe(147.0);
      expect(result.indicators.sma20[1].value).toBe(148.0);
      expect(result.indicators.sma20[2].value).toBe(149.0);

      // Verify timestamps increase
      expect(result.bars[0].time).toBeLessThan(result.bars[1].time);
      expect(result.bars[1].time).toBeLessThan(result.bars[2].time);
    });

    it("should return both bars and indicators in result", () => {
      const dbRecords = [
        { timestamp: new Date("2024-01-01T10:00:00Z"), close: "150.0" },
      ];

      const taRecords = [
        {
          timestamp: new Date("2024-01-01T10:00:00Z"),
          indicators: { trend: { sma: { 20: 147.0 } } },
        },
      ];

      const result = StreamService.dbToFrontend(dbRecords, taRecords);

      expect(result).toHaveProperty("bars");
      expect(result).toHaveProperty("indicators");
      expect(Object.keys(result)).toEqual(["bars", "indicators"]);
    });

    it("should handle large datasets efficiently", () => {
      // Create 1000 records
      const dbRecords = Array.from({ length: 1000 }, (_, i) => ({
        timestamp: new Date(Date.UTC(2024, 0, 1, 10, i)),
        close: `${150 + i * 0.1}`,
      }));

      const taRecords = Array.from({ length: 1000 }, (_, i) => ({
        timestamp: new Date(Date.UTC(2024, 0, 1, 10, i)),
        indicators: {
          trend: {
            sma: { 20: 147 + i * 0.1 },
            ema: { 20: 148 + i * 0.1 },
          },
        },
      }));

      const result = StreamService.dbToFrontend(dbRecords, taRecords);

      expect(result.bars).toHaveLength(1000);
      expect(result.indicators.sma20).toHaveLength(1000);
      expect(result.indicators.ema20).toHaveLength(1000);
    });
  });
});
