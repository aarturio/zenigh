import WebSocketClient from "../websocket-client.js";

class StreamController {
  constructor() {
    this.wsClient = null;
    this.isStreaming = false;
  }

  /**
   * Start streaming for a ticker
   * @param {string} ticker - Stock symbol
   * @param {Function} onBarReceived - Callback for new bar data
   */
  async start(ticker, onBarReceived) {
    if (this.isStreaming) {
      console.log("Stream already running");
      return;
    }

    if (!ticker) {
      throw new Error("Ticker is required");
    }

    console.log("Starting stream...");

    this.wsClient = new WebSocketClient(
      process.env.ALPACA_API_KEY,
      process.env.ALPACA_SECRET_KEY,
      "iex",
      false // Use real stream (not test)
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
      this.wsClient.disconnect();
      this.wsClient = null;
    }

    this.isStreaming = false;
  }

  /**
   * Get current streaming status
   */
  getStatus() {
    return { isStreaming: this.isStreaming };
  }
}

export default StreamController;
