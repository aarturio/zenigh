import SocketManager from "./modules/socket-manager.js";
import StreamController from "./modules/stream-controller.js";
import DataTransformer from "./modules/data-transformer.js";
import HistoricalLoader from "./modules/historical-loader.js";
import DatabaseOperations from "../db/db-operations.js";

class StreamServer {
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
    // 1. Load historical data
    const historicalData = await this.historicalLoader.load(ticker, timeframe);

    // 2. Transform and send to frontend
    const formattedData = DataTransformer.dbToFrontend(historicalData);
    this.socketManager.broadcast("historicalData", formattedData);

    // 3. Start live stream
    await this.streamController.start(ticker, (alpacaBar) => {
      const bar = DataTransformer.alpacaToFrontend(alpacaBar);
      this.socketManager.broadcast("bar", bar);
    });

    // 4. Notify clients
    this.socketManager.broadcast("streamStatus", { isStreaming: true });
  }

  handleStopStream() {
    this.streamController.stop();
    this.socketManager.broadcast("streamStatus", { isStreaming: false });
  }
}

export default StreamServer;
