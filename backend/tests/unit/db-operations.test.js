import { describe, test, expect, beforeEach, vi } from "vitest";

// Mock the database connection
vi.mock("../../db/connection.js", () => {
  const mockQueryBuilder = {
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    onConflict: vi.fn().mockReturnThis(),
    ignore: vi.fn(),
  };

  const mockDb = vi.fn(() => mockQueryBuilder);
  mockDb.raw = vi.fn();
  mockDb.transaction = vi.fn((callback) => callback(mockQueryBuilder));

  return {
    default: mockDb,
  };
});

import DatabaseOperations from "../../db/db-operations.js";
import db from "../../db/connection.js";

describe("DatabaseOperations - getMarketData", () => {
  let mockQueryBuilder;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryBuilder = db();
  });

  test("should fetch data for a specific symbol", async () => {
    // Arrange: Set up test data
    const symbol = "AAPL";
    const tableName = "market_data_1d";
    const expectedData = [
      { symbol: "AAPL", timestamp: "2024-01-01", close: 150 },
      { symbol: "AAPL", timestamp: "2024-01-02", close: 152 },
    ];

    // Mock the database response
    mockQueryBuilder.orderBy.mockResolvedValue(expectedData);

    // Act: Call the function
    const result = await DatabaseOperations.getMarketData(symbol, tableName);

    // Assert: Check the results
    expect(db).toHaveBeenCalledWith(tableName);
    expect(mockQueryBuilder.where).toHaveBeenCalledWith({ symbol });
    expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith("timestamp", "asc");
    expect(result).toEqual(expectedData);
  });

  test("should return empty array when no data exists", async () => {
    // Arrange
    const symbol = "TSLA";
    const tableName = "market_data_1h";

    // Mock empty response
    mockQueryBuilder.orderBy.mockResolvedValue([]);

    // Act
    const result = await DatabaseOperations.getMarketData(symbol, tableName);

    // Assert
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });
});

describe("DatabaseOperations - bulkInsertMarketData", () => {
  let mockQueryBuilder;
  let mockTrx;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryBuilder = db();

    // Create a transaction mock that acts like a query builder
    mockTrx = vi.fn(() => mockQueryBuilder);

    // Mock transaction to call the callback with mockTrx
    db.transaction.mockImplementation(async (callback) => {
      return await callback(mockTrx);
    });
  });

  test("should insert small batch of data", async () => {
    // Arrange: Small dataset (under batch size)
    const data = [
      {
        symbol: "AAPL",
        timestamp: "2024-01-01",
        close: 150,
        open: 148,
        high: 151,
        low: 147,
        volume: 1000,
      },
      {
        symbol: "AAPL",
        timestamp: "2024-01-02",
        close: 152,
        open: 150,
        high: 153,
        low: 149,
        volume: 1200,
      },
    ];
    const tableName = "market_data_1d";

    // Mock the insert operation
    mockQueryBuilder.ignore.mockResolvedValue(undefined);

    // Act
    await DatabaseOperations.bulkInsertMarketData(data, tableName);

    // Assert: Check that insert was called correctly
    expect(mockQueryBuilder.insert).toHaveBeenCalledWith(data);
    expect(mockQueryBuilder.onConflict).toHaveBeenCalledWith([
      "symbol",
      "timestamp",
    ]);
    expect(mockQueryBuilder.ignore).toHaveBeenCalled();
  });

  test("should handle empty data array", async () => {
    // Arrange
    const data = [];
    const tableName = "market_data_1h";

    // Act
    await DatabaseOperations.bulkInsertMarketData(data, tableName);

    // Assert: Should complete without errors, no inserts
    expect(mockQueryBuilder.insert).not.toHaveBeenCalled();
  });

  test("should use transaction for data insert", async () => {
    // Arrange
    const data = [
      {
        symbol: "TSLA",
        timestamp: "2024-01-01",
        close: 250,
        open: 248,
        high: 252,
        low: 247,
        volume: 5000,
      },
    ];
    const tableName = "market_data_1m";

    mockQueryBuilder.ignore.mockResolvedValue(undefined);

    // Act
    await DatabaseOperations.bulkInsertMarketData(data, tableName);

    // Assert: Transaction should be used
    expect(db.transaction).toHaveBeenCalled();
  });
});

describe("DatabaseOperations - initializeSchema", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should enable UUID extension", async () => {
    // Arrange
    db.raw.mockResolvedValue(undefined);

    // Act
    await DatabaseOperations.initializeSchema();

    // Assert: First call should enable UUID extension
    expect(db.raw).toHaveBeenCalledWith(
      expect.stringContaining('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    );
  });

  test("should create users table", async () => {
    // Arrange
    db.raw.mockResolvedValue(undefined);

    // Act
    await DatabaseOperations.initializeSchema();

    // Assert: Should create users table
    expect(db.raw).toHaveBeenCalledWith(
      expect.stringContaining("CREATE TABLE IF NOT EXISTS users")
    );
  });

  test("should handle schema creation errors", async () => {
    // Arrange: Mock an error
    const error = new Error("Database connection failed");
    db.raw.mockRejectedValue(error);

    // Act & Assert: Should throw the error
    await expect(DatabaseOperations.initializeSchema()).rejects.toThrow(
      "Database connection failed"
    );
  });
});
