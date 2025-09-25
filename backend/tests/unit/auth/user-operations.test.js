import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import UserOperations from "../../../db/user-operations.js";

// Mock the database connection module
vi.mock("../../../db/connection.js", () => ({
  default: {
    connect: vi.fn(),
  },
}));

describe("UserOperations - registerUser", () => {
  let mockClient;

  beforeEach(async () => {
    // Set up environment variables for testing
    process.env.JWT_SECRET = "test-secret-key-for-testing";

    // Create mock client with query and release methods
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };

    // Import the mocked pool and set up the mock
    const { default: pool } = await import("../../../db/connection.js");
    pool.connect.mockResolvedValue(mockClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("successful registration", () => {
    test("should create new user and return user data with JWT token", async () => {
      // Mock first query (check existing user) to return empty array
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      // Mock second query (insert user) to return new user data
      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            email: "test@gmail.com",
            first_name: "Fake",
            last_name: "User",
            created_at: new Date(),
          },
        ],
      });

      // Mock the database responses

      const result = await UserOperations.registerUser({
        email: "test@gmail.com",
        password: "12345678",
        firstName: "Fake",
        lastName: "User",
      });

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("token");
      expect(result.token).toBeTruthy;
    });
  });

  describe("duplicate email error", () => {
    test("should throw error when email already exists", async () => {
      // Mock first query to return existing user (triggers duplicate email error)
      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            email: "test@gmail.com",
            first_name: "Fake",
            last_name: "User",
            created_at: new Date(),
          },
        ],
      });
      // No second query needed - function throws error after first query
      await expect(
        UserOperations.registerUser({
          email: "test@gmail.com",
          password: "12345678",
        })
      ).rejects.toThrow("User with this email already exists");
    });
  });

  describe("input validation", () => {
    test("should reject invalid email format", async () => {
      await expect(
        UserOperations.registerUser({
          email: "not-an-email",
          password: "validpassword",
        })
      ).rejects.toThrow("Invalid email address");
    });

    test("should reject password shorter than 8 characters", async () => {
      await expect(
        UserOperations.registerUser({
          email: "valid@email.com",
          password: "short",
        })
      ).rejects.toThrow("Too small: expected string to have >=8 characters");
    });
  });
});
