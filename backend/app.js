import { createServer } from "http";

import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";

import { auth } from "./auth.js";
import { TABLE_MAP, TICKERS } from "./config.js";
import DatabaseOperations from "./db/db-operations.js";
import DatabaseSchema from "./db/db-schema.js";
import createDefaultUser from "./db/seed-user.js";
import StreamService from "./stream/stream-service.js";
import coreDataClient from "./utils/core-data-client.js";
import IndicatorService from "./utils/indicator-service.js";

const app = express();
const port = 3000;
const httpServer = createServer(app);

// Enable CORS for frontend with credentials support
app.use(
  cors({
    origin: "http://localhost:5173", // Frontend URL
    credentials: true, // Allow cookies/credentials
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON bodies
app.use(express.json());

app.all("/api/auth/{*any}", toNodeHandler(auth));

app.get("/", (req, res) => {
  res.json({ message: "Market data API server running" });
});

app.get("/ingest/:startDate/:endDate", async (req, res) => {
  const results = { success: [], failed: [] };

  try {
    const { startDate, endDate } = req.params;

    for (const tf in TABLE_MAP) {
      try {
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
          await DatabaseOperations.insertMarketData(formattedData, tableName);
          results.success.push({ timeframe: tf, count: formattedData.length });
        } else {
          results.success.push({ timeframe: tf, count: 0 });
        }
      } catch (error) {
        console.error(`Failed to ingest ${tf}:`, error.message);
        results.failed.push({ timeframe: tf, error: error.message });
        // Continue with other timeframes
      }
    }

    // Calculate technical indicators for all tickers and timeframes
    console.log("Starting technical indicator calculations...");
    const indicatorResults = { success: [], failed: [] };

    for (const ticker of TICKERS) {
      for (const tf in TABLE_MAP) {
        try {
          await IndicatorService.calculateAndSave(ticker, tf);
          indicatorResults.success.push({ ticker, timeframe: tf });
        } catch (error) {
          console.error(
            `Failed to calculate indicators for ${ticker} (${tf}):`,
            error.message
          );
          indicatorResults.failed.push({
            ticker,
            timeframe: tf,
            error: error.message,
          });
          // Continue with other tickers/timeframes
        }
      }
    }

    console.log("Technical indicator calculations completed");

    res.json({
      message: "Data ingestion and indicator calculation completed",
      results,
      indicators: indicatorResults,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      results,
    });
  }
});

app.get("/ta/:symbol/:timeframe", async (req, res) => {
  try {
    const { symbol, timeframe } = req.params;
    const data = await DatabaseOperations.getTechnicalAnalysis(
      symbol,
      timeframe
    );
    res.json({
      message: "TA fetched!",
      data,
    });
  } catch (error) {
    console.error(`Failed to fetch TA data:`, error.message);
  }
});

// Store server instances for graceful shutdown
let streamService = null;

// Initialize database and WebSocket server on startup
async function startServer() {
  try {
    await DatabaseSchema.initializeSchema();

    // Default user
    await createDefaultUser();

    // Initialize WebSocket stream service
    streamService = new StreamService(httpServer);

    httpServer.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
}

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  console.log(`${signal} received, shutting down gracefully`);

  try {
    // Stop all streams
    if (streamService) {
      console.log("Stopping active streams...");
      streamService.handleStopStream();
    }

    // Close HTTP server
    httpServer.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });

    // Force close after 10s
    setTimeout(() => {
      console.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();
