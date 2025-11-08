import WebSocketClient from "./websocket-client.js";

class StreamController {
  constructor() {
    this.wsClient = null;
    this.isStreaming = false;
    this.currentTicker = null; // Add ticker tracking
    this.currentTimeframe = null; // Add timeframe tracking
  }

  /**
   * Start streaming for a ticker
   * @param {string} ticker - Stock symbol
   * @param {Function} onBarReceived - Callback for new bar data
   */
  async start(ticker, onBarReceived, timeframe = "1Min") {
    if (this.isStreaming) {
      console.log("Stream already running");
      return;
    }

    if (!ticker) {
      throw new Error("Ticker is required");
    }

    // Enable test mode for FAKEPACA (works 24/7, even after market hours)
    const isTestMode = ticker.toUpperCase() === "FAKEPACA";

    console.log(`Starting stream... ${isTestMode ? "(TEST MODE)" : "(LIVE)"}`);

    this.currentTicker = ticker;
    this.currentTimeframe = timeframe;
    this.wsClient = new WebSocketClient(
      process.env.ALPACA_API_KEY,
      process.env.ALPACA_SECRET_KEY,
      "iex",
      isTestMode
    );

    this.wsClient.onAuthenticated = () => {
      console.log("API authenticated, subscribing to symbols...");
      this.wsClient.subscribe({
        bars: [ticker],
      });
    };

    this.wsClient.onBar = (bar) => {
      // Just pass the raw bar to the callback - let caller handle transformation
      onBarReceived(bar);
    };

    this.wsClient.connect();
    this.isStreaming = true;
  }

  /**
   * Stop active stream
   */
  stop() {
    if (!this.isStreaming) {
      console.log("Stream not running");
      return;
    }

    console.log("Stopping stream...");

    if (this.wsClient) {
      // First unsubscribe, THEN disconnect immediately
      const currentTicker = this.currentTicker;
      if (currentTicker && this.wsClient.isAuthenticated) {
        this.wsClient.unsubscribe({ bars: [currentTicker] });
      }

      // Disconnect immediately (not async) to prevent connection limit issues
      this.wsClient.disconnect();
      this.wsClient = null;
    }

    this.isStreaming = false;
    this.currentTicker = null;
  }

  /**
   * Get current streaming status
   */
  getStatus() {
    return {
      isStreaming: this.isStreaming,
      ticker: this.currentTicker,
      timeframe: this.currentTimeframe,
    };
  }
}

export default StreamController;
