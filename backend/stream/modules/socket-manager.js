import { Server } from "socket.io";

class SocketManager {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    this.connectedClients = new Set();
  }

  /**
   * Initialize socket event listeners
   * @param {Object} handlers - Event handlers { onStartStream, onStopStream }
   */
  setupHandlers(handlers) {
    this.io.on("connection", (socket) => {
      // Handle connection, attach listeners
      console.log("Frontend client connected:", socket.id);
      this.connectedClients.add(socket.id);

      // Let the caller (StreamServer) decide what status to send
      if (handlers.onConnection) {
        handlers.onConnection(socket);
      }

      socket.on("startStream", (data) => {
        handlers.onStartStream(data?.ticker, data?.timeframe);
      });

      socket.on("stopStream", () => {
        handlers.onStopStream();
      });

      socket.on("disconnect", () => {
        console.log("Frontend client disconnected:", socket.id);
        this.connectedClients.delete(socket.id);

        if (handlers.onDisconnect) {
          handlers.onDisconnect(socket.id);
        }
      });
    });
  }

  /**
   * Emit event to all connected clients
   */
  broadcast(eventName, data) {
    this.io.emit(eventName, data);
  }

  /**
   * Get count of connected clients
   */
  getClientCount() {
    return this.connectedClients.size;
  }
}

export default SocketManager;
