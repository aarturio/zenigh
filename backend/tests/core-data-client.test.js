import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import coreDataClient from "../utils/core-data-client.js";

describe("CoreDataClient", () => {
  let originalFetch;
  let fetchMock;

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;

    // Create fetch mock
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe("getBars", () => {
    it("should construct correct URL without page token", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ bars: {}, next_page_token: null }),
      });

      await coreDataClient.getBars("2024-01-01", "2024-01-02", "1Day");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const calledUrl = fetchMock.mock.calls[0][0];

      expect(calledUrl).toContain("https://data.alpaca.markets/v2/stocks/bars");
      expect(calledUrl).toContain("symbols=AAPL%2CMSFT%2CGOOGL%2CAMZN%2CNVDA%2CMETA%2CTSLA%2CNFLX%2CSNOW%2CRDDT");
      expect(calledUrl).toContain("timeframe=1Day");
      expect(calledUrl).toContain("start=2024-01-01");
      expect(calledUrl).toContain("end=2024-01-02");
      expect(calledUrl).toContain("limit=10000");
      expect(calledUrl).toContain("adjustment=raw");
      expect(calledUrl).toContain("feed=iex");
      expect(calledUrl).toContain("sort=asc");
    });

    it("should construct correct URL with page token", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ bars: {}, next_page_token: null }),
      });

      
      await coreDataClient.getBars("2024-01-01", "2024-01-02", "1Day", "page123");

      const calledUrl = fetchMock.mock.calls[0][0];
      expect(calledUrl).toContain("page_token=page123");
    });

    it("should include correct authentication headers", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ bars: {}, next_page_token: null }),
      });

      await coreDataClient.getBars("2024-01-01", "2024-01-02", "1Day");

      const options = fetchMock.mock.calls[0][1];
      expect(options.method).toBe("GET");
      expect(options.headers["APCA-API-KEY-ID"]).toBeDefined();
      expect(options.headers["APCA-API-SECRET-KEY"]).toBeDefined();
      expect(options.headers["Content-Type"]).toBe("application/json");

      // Verify it's using the client's credentials
      expect(options.headers["APCA-API-KEY-ID"]).toBe(coreDataClient.keyId);
      expect(options.headers["APCA-API-SECRET-KEY"]).toBe(coreDataClient.secretKey);
    });

    it("should return parsed JSON response", async () => {
      const mockData = {
        bars: {
          AAPL: [{ t: "2024-01-01T10:00:00Z", c: 150.0 }],
        },
        next_page_token: null,
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      
      const result = await coreDataClient.getBars("2024-01-01", "2024-01-02", "1Day");

      expect(result).toEqual(mockData);
    });

    it("should throw error on HTTP error response", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
      });

      

      await expect(
        coreDataClient.getBars("2024-01-01", "2024-01-02", "1Day")
      ).rejects.toThrow("HTTP error! status: 401");
    });

    it("should throw error on network failure", async () => {
      fetchMock.mockRejectedValue(new Error("Network error"));

      

      await expect(
        coreDataClient.getBars("2024-01-01", "2024-01-02", "1Day")
      ).rejects.toThrow("Network error");
    });

    it("should handle different timeframes", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ bars: {}, next_page_token: null }),
      });

      

      const timeframes = ["1Min", "5Min", "1Hour", "1Day"];

      for (const timeframe of timeframes) {
        await coreDataClient.getBars("2024-01-01", "2024-01-02", timeframe);
        const calledUrl = fetchMock.mock.calls[fetchMock.mock.calls.length - 1][0];
        expect(calledUrl).toContain(`timeframe=${timeframe}`);
      }
    });
  });

  describe("getData", () => {
    it("should fetch single page when no next_page_token", async () => {
      const mockResponse = {
        bars: {
          AAPL: [
            { t: "2024-01-01T10:00:00Z", c: 150.0 },
            { t: "2024-01-01T11:00:00Z", c: 151.0 },
          ],
        },
        next_page_token: null,
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      
      const result = await coreDataClient.getData("2024-01-01", "2024-01-02", "1Day");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse.bars);
      expect(result.AAPL).toHaveLength(2);
    });

    it("should handle pagination with multiple pages", async () => {
      const page1 = {
        bars: {
          AAPL: [{ t: "2024-01-01T10:00:00Z", c: 150.0 }],
          MSFT: [{ t: "2024-01-01T10:00:00Z", c: 300.0 }],
        },
        next_page_token: "page2",
      };

      const page2 = {
        bars: {
          AAPL: [{ t: "2024-01-01T11:00:00Z", c: 151.0 }],
          MSFT: [{ t: "2024-01-01T11:00:00Z", c: 301.0 }],
        },
        next_page_token: "page3",
      };

      const page3 = {
        bars: {
          AAPL: [{ t: "2024-01-01T12:00:00Z", c: 152.0 }],
          MSFT: [{ t: "2024-01-01T12:00:00Z", c: 302.0 }],
        },
        next_page_token: null,
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => page1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => page2,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => page3,
        });

      
      const result = await coreDataClient.getData("2024-01-01", "2024-01-02", "1Day");

      // Should have made 3 requests
      expect(fetchMock).toHaveBeenCalledTimes(3);

      // Should have merged all bars
      expect(result.AAPL).toHaveLength(3);
      expect(result.MSFT).toHaveLength(3);

      // Verify order is maintained
      expect(result.AAPL[0].c).toBe(150.0);
      expect(result.AAPL[1].c).toBe(151.0);
      expect(result.AAPL[2].c).toBe(152.0);
    });

    it("should pass page_token to subsequent requests", async () => {
      const page1 = {
        bars: { AAPL: [{ c: 150.0 }] },
        next_page_token: "token123",
      };

      const page2 = {
        bars: { AAPL: [{ c: 151.0 }] },
        next_page_token: null,
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => page1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => page2,
        });

      
      await coreDataClient.getData("2024-01-01", "2024-01-02", "1Day");

      // First call should have no page_token
      const firstUrl = fetchMock.mock.calls[0][0];
      expect(firstUrl).not.toContain("page_token");

      // Second call should have page_token
      const secondUrl = fetchMock.mock.calls[1][0];
      expect(secondUrl).toContain("page_token=token123");
    });

    it("should handle multiple symbols across pages", async () => {
      const page1 = {
        bars: {
          AAPL: [{ c: 150.0 }],
          MSFT: [{ c: 300.0 }],
          GOOGL: [{ c: 140.0 }],
        },
        next_page_token: "page2",
      };

      const page2 = {
        bars: {
          AAPL: [{ c: 151.0 }],
          MSFT: [{ c: 301.0 }],
          NVDA: [{ c: 500.0 }],
        },
        next_page_token: null,
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => page1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => page2,
        });

      
      const result = await coreDataClient.getData("2024-01-01", "2024-01-02", "1Day");

      // AAPL and MSFT should have data from both pages
      expect(result.AAPL).toHaveLength(2);
      expect(result.MSFT).toHaveLength(2);

      // GOOGL only in page 1
      expect(result.GOOGL).toHaveLength(1);

      // NVDA only in page 2
      expect(result.NVDA).toHaveLength(1);
    });

    it("should handle new symbols appearing in later pages", async () => {
      const page1 = {
        bars: {
          AAPL: [{ c: 150.0 }],
        },
        next_page_token: "page2",
      };

      const page2 = {
        bars: {
          AAPL: [{ c: 151.0 }],
          TSLA: [{ c: 200.0 }], // New symbol in page 2
        },
        next_page_token: null,
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => page1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => page2,
        });

      
      const result = await coreDataClient.getData("2024-01-01", "2024-01-02", "1Day");

      expect(result.AAPL).toHaveLength(2);
      expect(result.TSLA).toHaveLength(1);
      expect(result.TSLA[0].c).toBe(200.0);
    });

    it("should handle empty bars in response", async () => {
      const mockResponse = {
        bars: {},
        next_page_token: null,
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      
      const result = await coreDataClient.getData("2024-01-01", "2024-01-02", "1Day");

      expect(result).toEqual({});
    });

    it("should propagate errors from getBars", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429, // Rate limit
      });

      

      await expect(
        coreDataClient.getData("2024-01-01", "2024-01-02", "1Day")
      ).rejects.toThrow("HTTP error! status: 429");
    });

    it("should handle large paginated dataset", async () => {
      // Simulate 10 pages
      const pages = Array.from({ length: 10 }, (_, i) => ({
        bars: {
          AAPL: [{ t: `2024-01-01T${i}:00:00Z`, c: 150 + i }],
        },
        next_page_token: i < 9 ? `page${i + 2}` : null,
      }));

      pages.forEach((page) => {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => page,
        });
      });

      
      const result = await coreDataClient.getData("2024-01-01", "2024-01-02", "1Min");

      expect(fetchMock).toHaveBeenCalledTimes(10);
      expect(result.AAPL).toHaveLength(10);
      expect(result.AAPL[0].c).toBe(150);
      expect(result.AAPL[9].c).toBe(159);
    });

    it("should maintain bar order across pages", async () => {
      const page1 = {
        bars: {
          AAPL: [
            { t: "2024-01-01T09:00:00Z", c: 149.0 },
            { t: "2024-01-01T10:00:00Z", c: 150.0 },
          ],
        },
        next_page_token: "page2",
      };

      const page2 = {
        bars: {
          AAPL: [
            { t: "2024-01-01T11:00:00Z", c: 151.0 },
            { t: "2024-01-01T12:00:00Z", c: 152.0 },
          ],
        },
        next_page_token: null,
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => page1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => page2,
        });

      
      const result = await coreDataClient.getData("2024-01-01", "2024-01-02", "1Hour");

      // Verify chronological order is maintained
      expect(result.AAPL[0].t).toBe("2024-01-01T09:00:00Z");
      expect(result.AAPL[1].t).toBe("2024-01-01T10:00:00Z");
      expect(result.AAPL[2].t).toBe("2024-01-01T11:00:00Z");
      expect(result.AAPL[3].t).toBe("2024-01-01T12:00:00Z");
    });
  });

  describe("instance properties", () => {
    it("should have API credentials configured", () => {
      expect(coreDataClient.keyId).toBeDefined();
      expect(coreDataClient.secretKey).toBeDefined();
      expect(typeof coreDataClient.keyId).toBe("string");
      expect(typeof coreDataClient.secretKey).toBe("string");
    });

    it("should use IEX feed", () => {
      expect(coreDataClient.feed).toBe("iex");
    });

    it("should have URL-encoded symbols", () => {
      // %2C is URL-encoded comma
      expect(coreDataClient.symbols).toContain("%2C");
      expect(coreDataClient.symbols).toContain("AAPL");
      expect(coreDataClient.symbols).toContain("MSFT");
      expect(coreDataClient.symbols).toContain("GOOGL");
    });
  });
});
