import { Server } from "socket.io";
import WebSocketClient from "./websocket-client.js";
import MarketDataOperations from "../db/operations.js";
import { TABLE_MAP } from "../config.js";

class StreamServer {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.wsClient = null;
    this.isStreaming = false;
    this.connectedClients = new Set();

    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      console.log("Frontend client connected:", socket.id);
      this.connectedClients.add(socket.id);

      // Send current streaming status
      socket.emit("streamStatus", { isStreaming: this.isStreaming });

      socket.on("startStream", (data) => {
        this.startStream(data?.ticker, data?.timeframe);
      });

      socket.on("stopStream", () => {
        this.stopStream();
      });

      socket.on("disconnect", () => {
        console.log("Frontend client disconnected:", socket.id);
        this.connectedClients.delete(socket.id);
      });
    });
  }

  async startStream(ticker, timeframe) {
    if (this.isStreaming) {
      console.log("Stream already running");
      return;
    }

    console.log("Starting stream...");
    console.log(timeframe);
    let tableName = TABLE_MAP[timeframe];
    console.log("Using table:", tableName);

    // Get market data from database
    try {
      const marketData = await MarketDataOperations.getMarketData(
        ticker,
        tableName
      );

      // const modifiedMarketData = marketData.map((bar) => ({
      //   ...bar,
      //   symbol: "FAKEPACA",
      // }));
      // Send historical data to frontend before starting live stream
      if (marketData.length > 0) {
        // Transform to match the format expected by frontend
        const historicalBars = marketData.map((bar) => ({
          symbol: bar.symbol,
          closePrice: bar.close,
          timestamp: new Date(bar.timestamp).getTime(),
        }));

        // Send historical data
        setTimeout(() => {
          this.io.emit("historicalData", historicalBars);
        }, 100);
      }
    } catch (error) {
      console.error("Error retrieving market data:", error);
    }

    // Use test stream for development
    this.wsClient = new WebSocketClient(
      process.env.ALPACA_API_KEY,
      process.env.ALPACA_SECRET_KEY,
      "iex",
      true // Use test stream
    );

    // Override methods to relay data to frontend
    this.wsClient.onAuthenticated = () => {
      console.log("API authenticated, subscribing to symbols...");
      if (ticker) {
        this.wsClient.subscribe({
          bars: [ticker],
        });
      } else {
        this.wsClient.subscribe({
          bars: ["FAKEPACA"],
        });
      }
    };

    this.wsClient.onBar = (bar) => {
      let closePrice = bar.c;

      if (bar.S === "FAKEPACA") {
        // Add random variation between -5% to +5%
        const variation = (Math.random() - 0.5) * 0.1; // -0.05 to +0.05
        closePrice = bar.c * (1 + variation);
        closePrice = Math.round(closePrice * 100) / 100; // Round to 2 decimals
      }
      const barData = {
        symbol: bar.S,
        closePrice: closePrice,
        timestamp: new Date(bar.t).getTime(),
      };

      this.io.emit("bar", barData);
    };

    this.wsClient.connect();
    this.isStreaming = true;
    this.io.emit("streamStatus", { isStreaming: true });
  }

  stopStream() {
    if (!this.isStreaming) {
      console.log("Stream not running");
      return;
    }

    console.log("Stopping stream...");

    if (this.wsClient) {
      this.wsClient.disconnect();
      this.wsClient = null;
    }

    this.isStreaming = false;
    this.io.emit("streamStatus", { isStreaming: false });
  }
}

export default StreamServer;
