import { describe, it, expect } from "vitest";
import { SYMBOLS, INDICATOR_CATEGORIES } from "../src/config";

describe("Config - SYMBOLS", () => {
  it("should export SYMBOLS as an array", () => {
    expect(Array.isArray(SYMBOLS)).toBe(true);
  });

  it("should contain exactly 10 symbols", () => {
    expect(SYMBOLS).toHaveLength(10);
  });

  it("should contain expected stock symbols", () => {
    const expectedSymbols = [
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
    expect(SYMBOLS).toEqual(expectedSymbols);
  });

  it("should have all symbols as uppercase strings", () => {
    SYMBOLS.forEach((symbol) => {
      expect(typeof symbol).toBe("string");
      expect(symbol).toBe(symbol.toUpperCase());
      expect(symbol.length).toBeGreaterThan(0);
    });
  });

  it("should have unique symbols (no duplicates)", () => {
    const uniqueSymbols = new Set(SYMBOLS);
    expect(uniqueSymbols.size).toBe(SYMBOLS.length);
  });
});

describe("Config - INDICATOR_CATEGORIES", () => {
  it("should export INDICATOR_CATEGORIES as an object", () => {
    expect(typeof INDICATOR_CATEGORIES).toBe("object");
    expect(INDICATOR_CATEGORIES).not.toBeNull();
  });

  it("should have exactly 4 categories", () => {
    const categories = Object.keys(INDICATOR_CATEGORIES);
    expect(categories).toHaveLength(4);
  });

  it("should have expected category names", () => {
    expect(INDICATOR_CATEGORIES).toHaveProperty("trend");
    expect(INDICATOR_CATEGORIES).toHaveProperty("momentum");
    expect(INDICATOR_CATEGORIES).toHaveProperty("volatility");
    expect(INDICATOR_CATEGORIES).toHaveProperty("other");
  });

  describe("Category structure", () => {
    it("should have title and indicators in each category", () => {
      Object.values(INDICATOR_CATEGORIES).forEach((category) => {
        expect(category).toHaveProperty("title");
        expect(category).toHaveProperty("indicators");
        expect(typeof category.title).toBe("string");
        expect(Array.isArray(category.indicators)).toBe(true);
      });
    });

    it("should have properly formatted category titles", () => {
      expect(INDICATOR_CATEGORIES.trend.title).toBe("Trend");
      expect(INDICATOR_CATEGORIES.momentum.title).toBe("Momentum");
      expect(INDICATOR_CATEGORIES.volatility.title).toBe("Volatility");
      expect(INDICATOR_CATEGORIES.other.title).toBe("Other");
    });
  });

  describe("Indicator structure", () => {
    it("should have id, label, and color for each indicator", () => {
      Object.values(INDICATOR_CATEGORIES).forEach((category) => {
        category.indicators.forEach((indicator) => {
          expect(indicator).toHaveProperty("id");
          expect(indicator).toHaveProperty("label");
          expect(indicator).toHaveProperty("color");

          expect(typeof indicator.id).toBe("string");
          expect(typeof indicator.label).toBe("string");
          expect(typeof indicator.color).toBe("string");
        });
      });
    });

    it("should have valid color format (hex)", () => {
      const hexColorRegex = /^#[0-9a-f]{6}$/i;

      Object.values(INDICATOR_CATEGORIES).forEach((category) => {
        category.indicators.forEach((indicator) => {
          expect(indicator.color).toMatch(hexColorRegex);
        });
      });
    });

    it("should have unique indicator IDs across all categories", () => {
      const allIds = Object.values(INDICATOR_CATEGORIES).flatMap((category) =>
        category.indicators.map((ind) => ind.id)
      );

      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });
  });

  describe("Trend category", () => {
    it("should have 20 indicators (10 SMA + 10 EMA)", () => {
      expect(INDICATOR_CATEGORIES.trend.indicators).toHaveLength(20);
    });

    it("should have SMA indicators for periods: 5, 8, 10, 13, 20, 34, 50, 100, 150, 200", () => {
      const smaIndicators = INDICATOR_CATEGORIES.trend.indicators.filter(
        (ind) => ind.id.startsWith("SMA")
      );
      expect(smaIndicators).toHaveLength(10);

      const smaPeriods = smaIndicators.map((ind) =>
        parseInt(ind.id.replace("SMA", ""))
      );
      expect(smaPeriods.sort((a, b) => a - b)).toEqual([
        5, 8, 10, 13, 20, 34, 50, 100, 150, 200,
      ]);
    });

    it("should have EMA indicators for periods: 5, 8, 10, 13, 20, 34, 50, 100, 150, 200", () => {
      const emaIndicators = INDICATOR_CATEGORIES.trend.indicators.filter(
        (ind) => ind.id.startsWith("EMA")
      );
      expect(emaIndicators).toHaveLength(10);

      const emaPeriods = emaIndicators.map((ind) =>
        parseInt(ind.id.replace("EMA", ""))
      );
      expect(emaPeriods.sort((a, b) => a - b)).toEqual([
        5, 8, 10, 13, 20, 34, 50, 100, 150, 200,
      ]);
    });
  });

  describe("Momentum category", () => {
    it("should have exactly 3 indicators", () => {
      expect(INDICATOR_CATEGORIES.momentum.indicators).toHaveLength(3);
    });

    it("should include RSI, MACD, and STOCH indicators", () => {
      const ids = INDICATOR_CATEGORIES.momentum.indicators.map((ind) => ind.id);
      expect(ids).toContain("RSI");
      expect(ids).toContain("MACD");
      expect(ids).toContain("STOCH");
    });
  });

  describe("Volatility category", () => {
    it("should have exactly 2 indicators", () => {
      expect(INDICATOR_CATEGORIES.volatility.indicators).toHaveLength(2);
    });

    it("should include BBANDS and ATR indicators", () => {
      const ids = INDICATOR_CATEGORIES.volatility.indicators.map(
        (ind) => ind.id
      );
      expect(ids).toContain("BBANDS");
      expect(ids).toContain("ATR");
    });
  });

  describe("Other category", () => {
    it("should have exactly 3 indicators", () => {
      expect(INDICATOR_CATEGORIES.other.indicators).toHaveLength(3);
    });

    it("should include ADX, CCI, and OBV indicators", () => {
      const ids = INDICATOR_CATEGORIES.other.indicators.map((ind) => ind.id);
      expect(ids).toContain("ADX");
      expect(ids).toContain("CCI");
      expect(ids).toContain("OBV");
    });
  });

  describe("Total indicators count", () => {
    it("should have 28 indicators in total (20 trend + 3 momentum + 2 volatility + 3 other)", () => {
      const totalCount = Object.values(INDICATOR_CATEGORIES).reduce(
        (sum, category) => sum + category.indicators.length,
        0
      );
      expect(totalCount).toBe(28);
    });
  });
});
