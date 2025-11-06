import { Server } from "socket.io";
import { AuthUtils } from "../auth/index.js";

class SocketManager {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // Add authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;

        // Skip auth in development if no token provided
        if (!token) {
          if (process.env.NODE_ENV === 'development') {
            console.log('⚠️  No token provided - allowing connection in development mode');
            socket.user = { userId: 'dev-user', email: 'dev@localhost' };
            return next();
          }
          throw new Error("Authentication required");
        }

        // Verify token using existing auth module
        const decoded = AuthUtils.verifyJWT(token);
        if (!decoded) {
          throw new Error("Invalid token");
        }
        socket.user = decoded;
        next();
      } catch (error) {
        console.error("Socket authentication failed:", error);
        next(new Error("Authentication failed"));
      }
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
