const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const StreamServer = require("./stream/stream-server");

const app = express();
const port = 3000;
const httpServer = createServer(app);

// Enable CORS for frontend
app.use(cors());

const marketDataClient = require("./core/market-data-client.js");
const MarketDataOperations = require("./db/operations.js");
const ParquetOperations = require("./core/parquet-operations.js");

app.get("/", (req, res) => {
  res.json({ message: "Market data API server running" });
});

// GET endpoint to retrieve market data by symbol
app.get("/market/data/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    // Get market data from database
    const marketData = await MarketDataOperations.getMarketDataPaginated(
      symbol.toUpperCase(),
      limit,
      offset
    );

    if (marketData.length === 0) {
      return res.status(404).json({
        error: `No data found for symbol ${symbol.toUpperCase()}`,
      });
    }

    res.json({
      symbol: symbol.toUpperCase(),
      count: marketData.length,
      limit,
      offset,
      data: marketData,
    });
  } catch (error) {
    console.error("Error retrieving market data:", error);
    res.status(500).json({ error: "Failed to retrieve market data" });
  }
});

app.get("/ingest/:startDate/:endDate", async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    const dates = ParquetOperations.generateDateRange(startDate, endDate);

    let totalRecords = 0;
    let fromCache = 0;
    let fromAPI = 0;

    for (const date of dates) {
      console.log(`Processing ${date}...`);

      if (ParquetOperations.hasDataForDate(date)) {
        // Load from cache
        const existingData = await ParquetOperations.loadDailyData(date);
        await MarketDataOperations.bulkInsertMarketData(existingData);
        totalRecords += existingData.length;
        fromCache++;
        console.log(`${date}: Loaded ${existingData.length} from cache`);
      } else {
        // Fetch from API
        try {
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);

          let bars = {};

          const recursiveIterator = async function (token = null) {
            const page = await marketDataClient.getBars(
              startDate,
              endDate,
              token
            );

            bars = { ...bars, ...page.bars };
            if (page.next_page_token) {
              return recursiveIterator(page.next_page_token);
            }
            return bars;
          };

          await recursiveIterator();

          const data = Object.entries(bars).flatMap(([symbol, symbolBars]) =>
            symbolBars.map((bar) => ({
              symbol: symbol,
              timestamp: new Date(bar.t),
              open: bar.o,
              high: bar.h,
              low: bar.l,
              close: bar.c,
              volume: bar.v,
              trade_count: bar.n,
              vwap: bar.vw,
            }))
          );

          if (data.length > 0) {
            await ParquetOperations.saveDailyData(date, data);
            await MarketDataOperations.bulkInsertMarketData(data);
            totalRecords += data.length;
            fromAPI++;
            console.log(`${date}: Fetched ${data.length} from API`);
          }
        } catch (dateError) {
          console.error(`Error processing ${date}:`, dateError.message);
        }
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    res.json({
      message: `Test data fetch completed`,
      dateRange: `${startDate} to ${endDate}`,
      totalDays: dates.length,
      totalRecords,
      fromCache,
      fromAPI,
      summary: `${fromCache} days from cache, ${fromAPI} days from API`,
    });
  } catch (error) {
    console.error("Error in /test endpoint:", error);
    res.status(500).json({ error: "Failed to fetch test data" });
  }
});

// Initialize database and WebSocket server on startup
async function startServer() {
  try {
    // await MarketDataOperations.initializeSchema();

    // Initialize WebSocket stream server
    const streamServer = new StreamServer(httpServer);

    httpServer.listen(port, () => {
      console.log(`Server listening on port ${port}`);
      console.log(`WebSocket server ready for real-time streaming`);
    });
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
}

startServer();
