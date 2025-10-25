import SocketManager from "./modules/socket-manager.js";
import StreamController from "./modules/stream-controller.js";
import DataTransformer from "./modules/data-transformer.js";
import HistoricalLoader from "./modules/historical-loader.js";
import IndicatorCalculator from "./modules/indicator-calculator.js";
import DatabaseOperations from "../db/db-operations.js";

class StreamServer {
  constructor(httpServer) {
    // Initialize modules
    this.socketManager = new SocketManager(httpServer);
    this.streamController = new StreamController();
    this.historicalLoader = new HistoricalLoader(DatabaseOperations);
    this.indicatorCalculator = new IndicatorCalculator();

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

    // 2. Initialize indicator calculator with historical data
    this.indicatorCalculator.reset();
    this.indicatorCalculator.initialize(historicalData);

    // 3. Calculate initial indicators
    const initialIndicators = this.indicatorCalculator.calculateIndicators();

    // 4. Transform and send to frontend
    const formattedData = DataTransformer.dbToFrontend(historicalData);
    this.socketManager.broadcast("historicalData", {
      bars: formattedData,
      indicators: initialIndicators,
    });

    // 5. Start live stream
    await this.streamController.start(ticker, (alpacaBar) => {
      const bar = DataTransformer.alpacaToFrontend(alpacaBar);

      // Calculate indicators with new bar
      const barWithOHLCV = {
        timestamp: alpacaBar.Timestamp,
        open: alpacaBar.OpenPrice,
        high: alpacaBar.HighPrice,
        low: alpacaBar.LowPrice,
        close: alpacaBar.ClosePrice,
        volume: alpacaBar.Volume,
      };

      const indicators = this.indicatorCalculator.addBarAndCalculate(barWithOHLCV);

      this.socketManager.broadcast("bar", {
        bar,
        indicators,
      });
    });

    // 6. Notify clients
    this.socketManager.broadcast("streamStatus", { isStreaming: true });
  }

  handleStopStream() {
    this.streamController.stop();
    this.socketManager.broadcast("streamStatus", { isStreaming: false });
  }
}

export default StreamServer;
