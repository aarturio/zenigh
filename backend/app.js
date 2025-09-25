import express from "express";
import cors from "cors";
import { createServer } from "http";
import StreamServer from "./stream/stream-server.js";

import coreDataClient from "./core/core-data-client.js";
import DatabaseOperations from "./db/db-operations.js";
import UserOperations from "./db/user-operations.js";
import { authenticateToken } from "./middleware/auth.js";
import { TABLE_MAP } from "./config.js";

const app = express();
const port = 3000;
const httpServer = createServer(app);

// Enable CORS for frontend
app.use(cors());
// Parse JSON bodies
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Market data API server running" });
});

// Authentication routes
app.post("/auth/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const result = await UserOperations.registerUser({
      email,
      password,
      firstName,
      lastName,
    });
    res.status(201).json(result);
  } catch (error) {
    console.error("Registration error:", error);
    if (error.message === "User with this email already exists") {
      return res.status(409).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await UserOperations.loginUser({ email, password });
    res.json(result);
  } catch (error) {
    console.error("Login error:", error);
    if (error.message === "Invalid email or password") {
      return res.status(401).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

app.get("/auth/me", authenticateToken, async (req, res) => {
  res.json({ user: req.user });
});

// GET endpoint to retrieve market data by symbol
app.get("/market/data/:symbol/:timeframe", async (req, res) => {
  try {
    const { symbol, timeframe } = req.params;
    const tableName = TABLE_MAP[timeframe];

    // Get market data from database
    const marketData = await DatabaseOperations.getMarketData(
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

app.get("/ingest/:startDate/:endDate", async (req, res) => {
  try {
    const { startDate, endDate } = req.params;

    for (const tf in TABLE_MAP) {
      const tableName = TABLE_MAP[tf];
      const data = await coreDataClient.getData(startDate, endDate, tf);

      const formattedData = Object.entries(data).flatMap(
        ([symbol, symbolBars]) =>
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

      if (formattedData.length > 0) {
        console.log(
          `Inserting ${formattedData.length} records into ${tableName}`
        );
        await DatabaseOperations.bulkInsertMarketData(formattedData, tableName);
      }
    }

    res.json({
      message: "Data fetch completed",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.error(`Error processing:`, error.message);
  }
});

// Initialize database and WebSocket server on startup
async function startServer() {
  try {
    await DatabaseOperations.initializeSchema();

    // Initialize WebSocket stream server
    new StreamServer(httpServer);

    httpServer.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
}

startServer();
