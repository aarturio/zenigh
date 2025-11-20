// backend/tests/db-operations.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";

import DatabaseOperations from "../db/db-operations.js";

// Mock the db module
vi.mock("../db/db-connection.js", () => ({
  default: vi.fn(),
}));

const db = (await import("../db/db-connection.js")).default;

describe("DatabaseOperations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMarketData", () => {
    it("should map 1T timeframe to market_data_1m table", async () => {
      db.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      });

      await DatabaseOperations.getMarketData("AAPL", "1T");

      expect(db).toHaveBeenCalledWith("market_data_1m");
    });

    it("should map 5T timeframe to market_data_5m table", async () => {
      db.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      });

      await DatabaseOperations.getMarketData("AAPL", "5T");

      expect(db).toHaveBeenCalledWith("market_data_5m");
    });

    it("should map 1H timeframe to market_data_1h table", async () => {
      db.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      });

      await DatabaseOperations.getMarketData("AAPL", "1H");

      expect(db).toHaveBeenCalledWith("market_data_1h");
    });

    it("should map 1D timeframe to market_data_1d table", async () => {
      db.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      });

      await DatabaseOperations.getMarketData("AAPL", "1D");

      expect(db).toHaveBeenCalledWith("market_data_1d");
    });

    it("should reverse data from DESC to chronological (ASC) order", async () => {
      // Mock DB returns data in DESC order (newest first)
      const mockDbData = [
        { symbol: "AAPL", timestamp: "2024-01-03T10:00:00Z", close: 152.0 },
        { symbol: "AAPL", timestamp: "2024-01-02T10:00:00Z", close: 151.0 },
        { symbol: "AAPL", timestamp: "2024-01-01T10:00:00Z", close: 150.0 },
      ];

      db.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockDbData),
      });

      const result = await DatabaseOperations.getMarketData("AAPL", "1D");

      // Verify data is now in chronological order (oldest first)
      expect(result).toHaveLength(3);
      expect(result[0].timestamp).toBe("2024-01-01T10:00:00Z");
      expect(result[1].timestamp).toBe("2024-01-02T10:00:00Z");
      expect(result[2].timestamp).toBe("2024-01-03T10:00:00Z");
      expect(result[0].close).toBe(150.0);
      expect(result[2].close).toBe(152.0);
    });

    it("should pass correct WHERE clause with symbol", async () => {
      const whereSpy = vi.fn().mockReturnThis();
      const orderBySpy = vi.fn().mockResolvedValue([]);

      db.mockReturnValue({
        where: whereSpy,
        orderBy: orderBySpy,
      });

      await DatabaseOperations.getMarketData("MSFT", "1D");

      expect(whereSpy).toHaveBeenCalledWith({ symbol: "MSFT" });
    });

    it("should order by timestamp DESC before reversing", async () => {
      const whereSpy = vi.fn().mockReturnThis();
      const orderBySpy = vi.fn().mockResolvedValue([]);

      db.mockReturnValue({
        where: whereSpy,
        orderBy: orderBySpy,
      });

      await DatabaseOperations.getMarketData("AAPL", "1D");

      expect(orderBySpy).toHaveBeenCalledWith("timestamp", "desc");
    });

    it("should throw error for invalid timeframe", async () => {
      await expect(
        DatabaseOperations.getMarketData("AAPL", "INVALID")
      ).rejects.toThrow("Invalid timeframe: INVALID");
    });

    it("should throw error for undefined timeframe", async () => {
      await expect(
        DatabaseOperations.getMarketData("AAPL", undefined)
      ).rejects.toThrow("Invalid timeframe");
    });

    it("should handle empty result set", async () => {
      db.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      });

      const result = await DatabaseOperations.getMarketData("AAPL", "1D");

      expect(result).toEqual([]);
    });

    it("should handle single row result", async () => {
      const mockDbData = [
        { symbol: "AAPL", timestamp: "2024-01-01T10:00:00Z", close: 150.0 },
      ];

      db.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockDbData),
      });

      const result = await DatabaseOperations.getMarketData("AAPL", "1D");

      expect(result).toHaveLength(1);
      expect(result[0].close).toBe(150.0);
    });
  });

  describe("getTechnicalAnalysis", () => {
    it("should query technical_analysis table", async () => {
      db.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      });

      await DatabaseOperations.getTechnicalAnalysis("AAPL", "1D");

      expect(db).toHaveBeenCalledWith("technical_analysis");
    });

    it("should reverse data from DESC to chronological (ASC) order", async () => {
      const mockDbData = [
        {
          symbol: "AAPL",
          timeframe: "1D",
          timestamp: "2024-01-03T10:00:00Z",
          indicators: { rsi: 70 },
        },
        {
          symbol: "AAPL",
          timeframe: "1D",
          timestamp: "2024-01-02T10:00:00Z",
          indicators: { rsi: 65 },
        },
        {
          symbol: "AAPL",
          timeframe: "1D",
          timestamp: "2024-01-01T10:00:00Z",
          indicators: { rsi: 60 },
        },
      ];

      db.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockDbData),
      });

      const result = await DatabaseOperations.getTechnicalAnalysis("AAPL", "1D");

      expect(result).toHaveLength(3);
      expect(result[0].timestamp).toBe("2024-01-01T10:00:00Z");
      expect(result[1].timestamp).toBe("2024-01-02T10:00:00Z");
      expect(result[2].timestamp).toBe("2024-01-03T10:00:00Z");
      expect(result[0].indicators.rsi).toBe(60);
      expect(result[2].indicators.rsi).toBe(70);
    });

    it("should pass correct WHERE clause with symbol and timeframe", async () => {
      const whereSpy = vi.fn().mockReturnThis();
      const orderBySpy = vi.fn().mockResolvedValue([]);

      db.mockReturnValue({
        where: whereSpy,
        orderBy: orderBySpy,
      });

      await DatabaseOperations.getTechnicalAnalysis("NVDA", "5T");

      expect(whereSpy).toHaveBeenCalledWith({ symbol: "NVDA", timeframe: "5T" });
    });

    it("should order by timestamp DESC before reversing", async () => {
      const whereSpy = vi.fn().mockReturnThis();
      const orderBySpy = vi.fn().mockResolvedValue([]);

      db.mockReturnValue({
        where: whereSpy,
        orderBy: orderBySpy,
      });

      await DatabaseOperations.getTechnicalAnalysis("AAPL", "1D");

      expect(orderBySpy).toHaveBeenCalledWith("timestamp", "desc");
    });

    it("should handle empty result set", async () => {
      db.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      });

      const result = await DatabaseOperations.getTechnicalAnalysis("AAPL", "1D");

      expect(result).toEqual([]);
    });
  });

  describe("saveMarketData", () => {
    it("should use transaction for batch insert", async () => {
      const chainMock = {
        insert: vi.fn().mockReturnThis(),
        onConflict: vi.fn().mockReturnThis(),
        ignore: vi.fn().mockResolvedValue(),
      };

      const trxMock = vi.fn(() => chainMock);

      const transactionMock = vi.fn(async (callback) => {
        await callback(trxMock);
      });

      db.transaction = transactionMock;

      const mockData = [
        { symbol: "AAPL", timestamp: "2024-01-01", close: 150.0 },
      ];

      await DatabaseOperations.saveMarketData(mockData, "market_data_1d");

      expect(transactionMock).toHaveBeenCalled();
      expect(trxMock).toHaveBeenCalledWith("market_data_1d");
    });

    it("should handle conflict with ignore strategy", async () => {
      const insertSpy = vi.fn().mockReturnThis();
      const onConflictSpy = vi.fn().mockReturnThis();
      const ignoreSpy = vi.fn().mockResolvedValue();

      const chainMock = {
        insert: insertSpy,
        onConflict: onConflictSpy,
        ignore: ignoreSpy,
      };

      const trxMock = vi.fn(() => chainMock);

      db.transaction = vi.fn(async (callback) => {
        await callback(trxMock);
      });

      const mockData = [
        { symbol: "AAPL", timestamp: "2024-01-01", close: 150.0 },
      ];

      await DatabaseOperations.saveMarketData(mockData, "market_data_1d");

      expect(onConflictSpy).toHaveBeenCalledWith(["symbol", "timestamp"]);
      expect(ignoreSpy).toHaveBeenCalled();
    });

    it("should process data in batches of 5000", async () => {
      const insertSpy = vi.fn().mockReturnThis();
      const chainMock = {
        insert: insertSpy,
        onConflict: vi.fn().mockReturnThis(),
        ignore: vi.fn().mockResolvedValue(),
      };

      const trxMock = vi.fn(() => chainMock);

      db.transaction = vi.fn(async (callback) => {
        await callback(trxMock);
      });

      // Create 12000 records (should be 3 batches)
      const mockData = Array.from({ length: 12000 }, (_, i) => ({
        symbol: "AAPL",
        timestamp: `2024-01-01T${String(i).padStart(2, "0")}:00:00Z`,
        close: 150.0 + i,
      }));

      await DatabaseOperations.saveMarketData(mockData, "market_data_1d");

      // Should have called insert 3 times (12000 / 5000 = 2.4 → 3 batches)
      expect(insertSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe("saveTechnicalAnalysis", () => {
    it("should use transaction for batch insert", async () => {
      const chainMock = {
        insert: vi.fn().mockReturnThis(),
        onConflict: vi.fn().mockReturnThis(),
        merge: vi.fn().mockResolvedValue(),
      };

      const trxMock = vi.fn(() => chainMock);

      const transactionMock = vi.fn(async (callback) => {
        await callback(trxMock);
      });

      db.transaction = transactionMock;

      const mockData = [
        {
          symbol: "AAPL",
          timeframe: "1D",
          timestamp: "2024-01-01",
          indicators: { rsi: 65 },
          signals: { overall: "bullish" },
          dataPointsUsed: 100,
        },
      ];

      await DatabaseOperations.saveTechnicalAnalysis(mockData);

      expect(transactionMock).toHaveBeenCalled();
      expect(trxMock).toHaveBeenCalledWith("technical_analysis");
    });

    it("should stringify indicators and signals as JSON", async () => {
      const insertSpy = vi.fn().mockReturnThis();
      const chainMock = {
        insert: insertSpy,
        onConflict: vi.fn().mockReturnThis(),
        merge: vi.fn().mockResolvedValue(),
      };

      const trxMock = vi.fn(() => chainMock);

      db.transaction = vi.fn(async (callback) => {
        await callback(trxMock);
      });

      const mockData = [
        {
          symbol: "AAPL",
          timeframe: "1D",
          timestamp: "2024-01-01",
          indicators: { rsi: 65, macd: { value: 1.2 } },
          signals: { overall: "bullish" },
          dataPointsUsed: 100,
        },
      ];

      await DatabaseOperations.saveTechnicalAnalysis(mockData);

      expect(insertSpy).toHaveBeenCalled();
      const insertedData = insertSpy.mock.calls[0][0][0];
      expect(typeof insertedData.indicators).toBe("string");
      expect(typeof insertedData.signals).toBe("string");
      expect(insertedData.indicators).toBe(
        JSON.stringify({ rsi: 65, macd: { value: 1.2 } })
      );
    });

    it("should use merge strategy on conflict", async () => {
      const onConflictSpy = vi.fn().mockReturnThis();
      const mergeSpy = vi.fn().mockResolvedValue();

      const chainMock = {
        insert: vi.fn().mockReturnThis(),
        onConflict: onConflictSpy,
        merge: mergeSpy,
      };

      const trxMock = vi.fn(() => chainMock);

      db.transaction = vi.fn(async (callback) => {
        await callback(trxMock);
      });

      const mockData = [
        {
          symbol: "AAPL",
          timeframe: "1D",
          timestamp: "2024-01-01",
          indicators: { rsi: 65 },
        },
      ];

      await DatabaseOperations.saveTechnicalAnalysis(mockData);

      expect(onConflictSpy).toHaveBeenCalledWith([
        "symbol",
        "timestamp",
        "timeframe",
      ]);
      expect(mergeSpy).toHaveBeenCalled();
    });
  });
});
