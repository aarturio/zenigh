// const WebSocket = require("ws");
import { WebSocket } from "ws";

class WebSocketClient {
  constructor(keyId, secretKey, feed = "iex", isTest = false) {
    this.keyId = keyId;
    this.secretKey = secretKey;
    this.feed = feed;
    this.isTest = isTest;
    this.ws = null;
    this.isAuthenticated = false;
    this.subscriptions = new Set();
  }

  connect() {
    const url = this.isTest
      ? "wss://stream.data.alpaca.markets/v2/test"
      : `wss://stream.data.alpaca.markets/v2/${this.feed}`;
    this.ws = new WebSocket(url);

    this.ws.on("open", () => {
      console.log(
        `WebSocket connected ${
          this.isTest ? "(TEST)" : `(${this.feed.toUpperCase()})`
        }`
      );
      this.authenticate();
    });

    this.ws.on("message", (data) => {
      try {
        const messages = JSON.parse(data.toString());
        this.handleMessages(Array.isArray(messages) ? messages : [messages]);
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });

    this.ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    this.ws.on("close", (code, reason) => {
      console.log(`WebSocket closed: ${code} ${reason}`);
      this.isAuthenticated = false;
    });
  }

  authenticate() {
    const authMessage = {
      action: "auth",
      key: this.keyId,
      secret: this.secretKey,
    };

    this.send(authMessage);
  }

  handleMessages(messages) {
    messages.forEach((msg) => {
      switch (msg.T) {
        case "success":
          if (msg.msg === "authenticated") {
            console.log("Successfully authenticated");
            this.isAuthenticated = true;
            this.onAuthenticated();
          } else if (msg.msg.includes("subscribed")) {
            console.log("Subscription successful:", msg.msg);
          }
          break;
        case "error":
          console.error("Error from server:", msg.msg);
          break;
        case "b": // Bar
          this.onBar(msg);
        default:
          console.log("Received message:", msg);
      }
    });
  }

  subscribe(channels) {
    if (!this.isAuthenticated) {
      console.error("Cannot subscribe: not authenticated");
      return;
    }

    const subscribeMessage = {
      action: "subscribe",
      ...channels,
    };

    this.send(subscribeMessage);

    // Track subscriptions
    Object.keys(channels).forEach((channel) => {
      channels[channel].forEach((symbol) => {
        this.subscriptions.add(`${channel}:${symbol}`);
      });
    });
  }

  unsubscribe(channels) {
    const unsubscribeMessage = {
      action: "unsubscribe",
      ...channels,
    };

    this.send(unsubscribeMessage);

    // Remove from tracked subscriptions
    Object.keys(channels).forEach((channel) => {
      channels[channel].forEach((symbol) => {
        this.subscriptions.delete(`${channel}:${symbol}`);
      });
    });
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not open");
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }

  // Override these methods to handle data
  onAuthenticated() {
    // Default: subscribe to AAPL trades and quotes
    this.subscribe({
      bars: ["AAPL"],
    });
  }
}

// module.exports = WebSocketClient;
export default WebSocketClient;
