const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;

// Enable CORS for frontend
app.use(cors());

const alpacaClient = require("./core/client.js");
const MarketDataOperations = require("./db/operations.js");
const ParquetOperations = require("./core/parquet-operations.js");
const sp500 = require("./sp500.json");

app.get("/", (req, res) => {
  alpacaClient.getAccount().then((account) => {
    res.json({ account: account });
  });
});

app.get("/ingest", async (req, res) => {
  try {
    const bars = await alpacaClient.getMultiBarsV2(sp500, {
      start: "2025-04-01",
      end: "2025-04-02",
      timeframe: alpacaClient.newTimeframe(30, alpacaClient.timeframeUnit.MIN),
    });

    const rawData = [];
    for await (let b of bars) {
      rawData.push(b);
    }

    // Flatten the nested structure: [symbol, [bar1, bar2, ...]] -> [bar1, bar2, ...]
    const flattenedBars = rawData.flatMap(([symbol, symbolBars]) =>
      symbolBars.map((bar) => ({
        symbol: bar.Symbol,
        timestamp: new Date(bar.Timestamp),
        open: bar.OpenPrice,
        high: bar.HighPrice,
        low: bar.LowPrice,
        close: bar.ClosePrice,
        volume: bar.Volume,
        trade_count: bar.TradeCount,
        vwap: bar.VWAP,
      }))
    );

    // Insert into database
    if (flattenedBars.length > 0) {
      await MarketDataOperations.bulkInsertMarketData(flattenedBars);
    }

    res.json({
      message: `Ingested ${flattenedBars.length} bars`,
      data: flattenedBars,
    });
  } catch (error) {
    console.error("Error fetching bars:", error);
    res.status(500).json({ error: "Failed to fetch market data" });
  }
});

// Ingest data for a specific date and save to parquet
app.get("/ingest/daily/:date", async (req, res) => {
  try {
    const { date } = req.params;

    // Check if we already have this data cached
    if (ParquetOperations.hasDataForDate(date)) {
      const existingData = await ParquetOperations.loadDailyData(date);

      // Load from parquet instead of API
      await MarketDataOperations.bulkInsertMarketData(existingData);

      return res.json({
        message: `Loaded ${existingData.length} records from parquet cache`,
        date,
        source: "parquet_cache",
        records: existingData.length,
      });
    }

    // Fetch fresh data from API
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const bars = await alpacaClient.getMultiBarsV2(sp500, {
      start: date,
      end: nextDay.toISOString().split("T")[0],
      timeframe: alpacaClient.newTimeframe(1, alpacaClient.timeframeUnit.DAY),
    });

    const rawData = [];
    for await (let b of bars) {
      rawData.push(b);
    }

    // Flatten the data
    const flattenedBars = rawData.flatMap(([symbol, symbolBars]) =>
      symbolBars.map((bar) => ({
        symbol: bar.Symbol,
        timestamp: new Date(bar.Timestamp),
        open: bar.OpenPrice,
        high: bar.HighPrice,
        low: bar.LowPrice,
        close: bar.ClosePrice,
        volume: bar.Volume,
        trade_count: bar.TradeCount,
        vwap: bar.VWAP,
      }))
    );

    // Save to parquet file
    await ParquetOperations.saveDailyData(date, flattenedBars);

    // Insert into database
    if (flattenedBars.length > 0) {
      await MarketDataOperations.bulkInsertMarketData(flattenedBars);
    }

    res.json({
      message: `Ingested ${flattenedBars.length} records for ${date}`,
      date,
      source: "api_fresh",
      records: flattenedBars.length,
      parquet_saved: true,
    });
  } catch (error) {
    console.error("Error ingesting daily data:", error);
    res.status(500).json({ error: "Failed to ingest daily data" });
  }
});

// Bulk ingest a year of data
app.get("/ingest/bulk/:startDate/:endDate", async (req, res) => {
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

          const bars = await alpacaClient.getMultiBarsV2(sp500, {
            start: date,
            end: nextDay.toISOString().split("T")[0],
            timeframe: alpacaClient.newTimeframe(
              1,
              alpacaClient.timeframeUnit.MIN
            ),
          });

          const rawData = [];
          for await (let b of bars) {
            rawData.push(b);
          }

          const flattenedBars = rawData.flatMap(([symbol, symbolBars]) =>
            symbolBars.map((bar) => ({
              symbol: bar.Symbol,
              timestamp: new Date(bar.Timestamp),
              open: bar.OpenPrice,
              high: bar.HighPrice,
              low: bar.LowPrice,
              close: bar.ClosePrice,
              volume: bar.Volume,
              trade_count: bar.TradeCount,
              vwap: bar.VWAP,
            }))
          );

          if (flattenedBars.length > 0) {
            await ParquetOperations.saveDailyData(date, flattenedBars);
            await MarketDataOperations.bulkInsertMarketData(flattenedBars);
            totalRecords += flattenedBars.length;
            fromAPI++;
            console.log(`${date}: Fetched ${flattenedBars.length} from API`);
          }
        } catch (dateError) {
          console.error(`Error processing ${date}:`, dateError.message);
        }
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    res.json({
      message: `Bulk ingestion completed`,
      dateRange: `${startDate} to ${endDate}`,
      totalDays: dates.length,
      totalRecords,
      fromCache,
      fromAPI,
      summary: `${fromCache} days from cache, ${fromAPI} days from API`,
    });
  } catch (error) {
    console.error("Error in bulk ingestion:", error);
    res.status(500).json({ error: "Failed to complete bulk ingestion" });
  }
});

// GET endpoint to retrieve market data by symbol (like Python version)
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

// Get available parquet files
app.get("/data/available", async (req, res) => {
  try {
    const dates = ParquetOperations.getAvailableDates();
    const fileInfo = dates.map((date) => ParquetOperations.getFileInfo(date));

    res.json({
      availableDates: dates,
      totalFiles: dates.length,
      files: fileInfo,
    });
  } catch (error) {
    console.error("Error getting available data:", error);
    res.status(500).json({ error: "Failed to get available data" });
  }
});

// Initialize database on startup
async function startServer() {
  try {
    await MarketDataOperations.initializeSchema();
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
}

startServer();
