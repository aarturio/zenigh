const { Server } = require("socket.io");
const WebSocketClient = require("./websocket-client");

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
        this.startStream(data?.ticker);
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

  startStream(ticker) {
    if (this.isStreaming) {
      console.log("Stream already running");
      return;
    }

    console.log("Starting stream...");

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

      console.log("Bar received:", bar);

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

module.exports = StreamServer;
