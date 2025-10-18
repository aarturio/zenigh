import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the Knex database connection with a factory function
vi.mock("../../db/connection.js", () => {
  const mockQueryBuilder = {
    where: vi.fn().mockReturnThis(),
    first: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  };

  const mockDb = vi.fn(() => mockQueryBuilder);

  return {
    default: mockDb,
  };
});

import UserOperations from "../../db/user-operations.js";
import db from "../../db/connection.js";

describe("UserOperations - registerUser", () => {
  let mockQueryBuilder;

  beforeEach(() => {
    // Set up environment variables for testing
    process.env.JWT_SECRET = "test-secret-key-for-testing";

    // Clear previous mock calls
    vi.clearAllMocks();

    // Get the mock query builder from the mocked db
    mockQueryBuilder = db();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("successful registration", () => {
    test("should create new user and return user data with JWT token", async () => {
      // Mock first query (check existing user) - returns undefined (no existing user)
      mockQueryBuilder.first.mockResolvedValueOnce(undefined);

      // Mock insert/returning chain (create new user)
      const newUser = {
        id: 1,
        email: "test@gmail.com",
        first_name: "Fake",
        last_name: "User",
        created_at: new Date(),
      };
      mockQueryBuilder.returning.mockResolvedValueOnce([newUser]);

      const result = await UserOperations.registerUser({
        email: "test@gmail.com",
        password: "12345678",
        firstName: "Fake",
        lastName: "User",
      });

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("token");
      expect(result.user.email).toBe("test@gmail.com");
      expect(result.user.firstName).toBe("Fake");
      expect(result.token).toBeTruthy();
    });
  });

  describe("duplicate email error", () => {
    test("should throw error when email already exists", async () => {
      // Mock first query to return existing user (triggers duplicate email error)
      const existingUser = {
        id: 1,
        email: "test@gmail.com",
        first_name: "Fake",
        last_name: "User",
        created_at: new Date(),
      };
      mockQueryBuilder.first.mockResolvedValueOnce(existingUser);

      await expect(
        UserOperations.registerUser({
          email: "test@gmail.com",
          password: "12345678",
          firstName: "Another",
          lastName: "User",
        })
      ).rejects.toThrow("User already exists");
    });
  });
});
