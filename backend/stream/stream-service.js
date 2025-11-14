import DatabaseOperations from "../db/db-operations.js";

import SocketManager from "./socket-manager.js";
import StreamController from "./stream-controller.js";

class StreamService {
  constructor(httpServer) {
    // Initialize modules
    this.socketManager = new SocketManager(httpServer);
    this.streamController = new StreamController();

    // Wire up event handlers
    this.socketManager.setupHandlers({
      onConnection: (socket) => {
        // Send current streaming status to newly connected client
        socket.emit("streamStatus", this.streamController.getStatus());
      },
      onStartStream: (ticker, timeframe) =>
        this.handleStartStream(ticker, timeframe),
      onStopStream: () => this.handleStopStream(),
    });
  }

  /**
   * Transform database records to frontend format
   * @param {Array} dbRecords - Records from database
   * @returns {Array} Formatted bars for frontend
   */
  static dbToFrontend(dbRecords, taRecords) {
    const bars = dbRecords.map((bar) => ({
      value: bar.close,
      time: new Date(bar.timestamp).getTime() / 1000,
    }));
    const indicators = {
      sma20: taRecords
        .filter((ta) => ta.indicators?.trend?.sma?.["20"] != null)
        .map((ta) => ({
          time: new Date(ta.timestamp).getTime() / 1000,
          value: ta.indicators.trend.sma["20"],
        })),
      // Add more indicators as needed
      // ema20: taRecords.filter(...).map(...),
    };
    return { bars, indicators };
  }

  /**
   * Transform Alpaca bar to frontend format
   * @param {Object} alpacaBar - Raw bar from Alpaca API
   * @returns {Object} Formatted bar
   */
  static liveToFrontend(alpacaBar) {
    return {
      time: new Date(alpacaBar.t).getTime() / 1000, // Convert to seconds
      value: alpacaBar.c,
    };
  }

  async handleStartStream(ticker, timeframe) {
    try {
      // Check if already streaming this exact ticker and timeframe
      const status = this.streamController.getStatus();
      if (
        status.isStreaming &&
        status.ticker === ticker &&
        status.timeframe === timeframe
      ) {
        console.log(
          `Already streaming ${ticker} (${timeframe}), ignoring duplicate request`
        );
        return;
      }

      // Stop existing stream if different ticker or timeframe
      if (status.isStreaming) {
        console.log(
          `Switching from ${status.ticker} (${status.timeframe}) to ${ticker} (${timeframe})`
        );
        this.handleStopStream();
        // Wait briefly for connection to fully close before starting new one
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      // 1. Load market and ta data
      console.log(`Loading historical data for ${ticker} (${timeframe})...`);
      const dbBars = await DatabaseOperations.getMarketData(ticker, timeframe);

      const taData = await DatabaseOperations.getTechnicalAnalysis(
        ticker,
        timeframe
      );

      // 2. Transform and send to frontend
      const formattedData = StreamService.dbToFrontend(dbBars, taData);
      this.socketManager.broadcast("dbBars", formattedData);

      // 3. Start live stream
      await this.streamController.start(ticker, (alpacaBar) => {
        const bar = StreamService.liveToFrontend(alpacaBar);

        this.socketManager.broadcast("bar", { bar });
      });

      // 4. Notify clients
      this.socketManager.broadcast("streamStatus", { isStreaming: true });
    } catch (error) {
      console.error("Error starting stream:", error);

      // Notify clients of the error
      this.socketManager.broadcast("streamError", {
        message: error.message,
        ticker,
        timeframe,
      });

      // Ensure clean state
      this.handleStopStream();
    }
  }
  handleStopStream() {
    this.streamController.stop();
    this.socketManager.broadcast("streamStatus", { isStreaming: false });
  }
}

export default StreamService;
