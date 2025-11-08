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
            try {
              this.onAuthenticated();
            } catch (error) {
              console.error("Error in onAuthenticated callback:", error);
            }
          } else if (msg.msg.includes("subscribed")) {
            console.log("Subscription successful:", msg.msg);
          }
          break;
        case "error":
          console.error("Error from server:", msg.msg);

          break;
        case "b": // Bar
          try {
            // Add randomness to FAKEPACA test data for realistic chart activity
            if (this.isTest && msg.S === "FAKEPACA") {
              this.onBar(this.addRandomness(msg));
            } else {
              this.onBar(msg);
            }
          } catch (error) {
            console.error("Error processing bar:", error);
          }
          break;
        // default:
        //   console.log("Received message:", msg);
      }
    });
  }

  /**
   * Add realistic price variations to test data
   * @param {Object} bar - Original bar data
   * @returns {Object} Modified bar with random variations
   */
  addRandomness(bar) {
    // Random variation between -0.5% and +0.5%
    const variation = (Math.random() - 0.5) * 0.01;
    const basePrice = bar.c || bar.o || 100;

    // Generate new prices with variation
    const open = basePrice * (1 + variation);
    const volatility = Math.random() * 0.005; // Up to 0.5% intrabar movement
    const high = open * (1 + Math.abs(volatility));
    const low = open * (1 - Math.abs(volatility));
    const close = low + Math.random() * (high - low);

    // Vary volume randomly between 1000 and 50000
    const volume = Math.floor(1000 + Math.random() * 49000);

    return {
      ...bar,
      o: parseFloat(open.toFixed(2)),
      h: parseFloat(high.toFixed(2)),
      l: parseFloat(low.toFixed(2)),
      c: parseFloat(close.toFixed(2)),
      v: volume,
      vw: parseFloat(((high + low + close) / 3).toFixed(2)), // Recalculate VWAP
    };
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

export default WebSocketClient;
