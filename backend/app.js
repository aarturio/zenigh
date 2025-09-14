import express from "express";
import cors from "cors";
import { createServer } from "http";
import StreamServer from "./stream/stream-server.js";

import marketDataClient from "./core/market-data-client.js";
import MarketDataOperations from "./db/operations.js";
import { TABLE_MAP } from "./config.js";

const app = express();
const port = 3000;
const httpServer = createServer(app);

// Enable CORS for frontend
app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "Market data API server running" });
});

// GET endpoint to retrieve market data by symbol
app.get("/market/data/:symbol/:timeframe", async (req, res) => {
  try {
    const { symbol, timeframe } = req.params;
    let tableName = TABLE_MAP[timeframe];

    // Get market data from database
    const marketData = await MarketDataOperations.getMarketData(
      symbol,
      tableName
    );

    if (marketData.length === 0) {
      return res.status(404).json({
        error: `No data found for symbol ${symbol.toUpperCase()}`,
      });
    }

    res.json({
      symbol: symbol.toUpperCase(),
      count: marketData.length,
      data: marketData,
    });
  } catch (error) {
    console.error("Error retrieving market data:", error);
    res.status(500).json({ error: "Failed to retrieve market data" });
  }
});

app.get("/ingest/:startDate/:endDate/:timeframe", async (req, res) => {
  try {
    const { startDate, endDate, timeframe } = req.params;

    let bars = {};
    let tableName = TABLE_MAP[timeframe];

    const recursiveIterator = async function (token = null) {
      const page = await marketDataClient.getBars(
        startDate,
        endDate,
        timeframe,
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
      console.log(`Inserting ${data.length} records into ${tableName}`);
      await MarketDataOperations.bulkInsertMarketData(data, tableName);
    }
    res.json({
      message: "Data fetch completed",
    });
  } catch (error) {
    console.error(`Error processing:`, error.message);
  }
});

// Initialize database and WebSocket server on startup
async function startServer() {
  try {
    await MarketDataOperations.initializeSchema();

    // Initialize WebSocket stream server
    const streamServer = new StreamServer(httpServer);

    httpServer.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
}

startServer();
