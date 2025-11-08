import SocketManager from "./socket-manager.js";
import StreamController from "./stream-controller.js";
import DataTransformer from "./data-transformer.js";
import HistoricalLoader from "./historical-loader.js";
import DatabaseOperations from "../db/db-operations.js";

class StreamService {
  constructor(httpServer) {
    // Initialize modules
    this.socketManager = new SocketManager(httpServer);
    this.streamController = new StreamController();
    this.historicalLoader = new HistoricalLoader(DatabaseOperations);

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

  async handleStartStream(ticker, timeframe) {
    try {
      // Check if already streaming this exact ticker and timeframe
      const status = this.streamController.getStatus();
      if (status.isStreaming && status.ticker === ticker && status.timeframe === timeframe) {
        console.log(`Already streaming ${ticker} (${timeframe}), ignoring duplicate request`);
        return;
      }

      // Stop existing stream if different ticker or timeframe
      if (status.isStreaming) {
        console.log(`Switching from ${status.ticker} (${status.timeframe}) to ${ticker} (${timeframe})`);
        this.handleStopStream();
        // Wait briefly for connection to fully close before starting new one
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      // 1. Load recent historical data (limited for performance)
      const historicalData = await this.historicalLoader.loadRecent(
        ticker,
        timeframe,
        500 // Limit to last 500 bars for better performance
      );

      // 2. Transform and send to frontend
      const formattedData = DataTransformer.dbToFrontend(historicalData);
      this.socketManager.broadcast("historicalData", {
        bars: formattedData,
      });

      // 3. Start live stream
      await this.streamController.start(ticker, (alpacaBar) => {
        const bar = DataTransformer.alpacaToFrontend(alpacaBar);

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
