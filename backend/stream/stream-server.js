const { Server } = require('socket.io');
const AlpacaWebSocketClient = require('./websocket-client');

class StreamServer {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    this.alpacaClient = null;
    this.isStreaming = false;
    this.connectedClients = new Set();
    
    this.setupSocketHandlers();
  }
  
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Frontend client connected:', socket.id);
      this.connectedClients.add(socket.id);
      
      // Send current streaming status
      socket.emit('streamStatus', { isStreaming: this.isStreaming });
      
      socket.on('startStream', () => {
        this.startAlpacaStream();
      });
      
      socket.on('stopStream', () => {
        this.stopAlpacaStream();
      });
      
      socket.on('disconnect', () => {
        console.log('Frontend client disconnected:', socket.id);
        this.connectedClients.delete(socket.id);
      });
    });
  }
  
  startAlpacaStream() {
    if (this.isStreaming) {
      console.log('Stream already running');
      return;
    }
    
    console.log('Starting Alpaca stream...');
    
    // Use test stream for development
    this.alpacaClient = new AlpacaWebSocketClient(
      process.env.ALPACA_API_KEY,
      process.env.ALPACA_SECRET_KEY,
      'iex',
      true // Use test stream
    );
    
    // Override methods to relay data to frontend
    this.alpacaClient.onAuthenticated = () => {
      console.log('Alpaca authenticated, subscribing to symbols...');
      this.alpacaClient.subscribe({
        trades: ['FAKEPACA', 'AAPL', 'GOOGL', 'TSLA']
      });
    };
    
    this.alpacaClient.onTrade = (trade) => {
      let price = trade.p;
      
      // Add randomness to FAKEPACA price data
      if (trade.S === 'FAKEPACA') {
        // Add random variation between -5% to +5%
        const variation = (Math.random() - 0.5) * 0.1; // -0.05 to +0.05
        price = trade.p * (1 + variation);
        price = Math.round(price * 100) / 100; // Round to 2 decimals
      }
      
      const tradeData = {
        symbol: trade.S,
        price: price,
        size: trade.s,
        timestamp: new Date(trade.t).getTime()
      };
      
      console.log('Relaying trade:', tradeData);
      this.io.emit('trade', tradeData);
    };
    
    this.alpacaClient.onQuote = (quote) => {
      const quoteData = {
        symbol: quote.S,
        bidPrice: quote.bp,
        askPrice: quote.ap,
        timestamp: new Date(quote.t).getTime()
      };
      
      this.io.emit('quote', quoteData);
    };
    
    this.alpacaClient.connect();
    this.isStreaming = true;
    this.io.emit('streamStatus', { isStreaming: true });
  }
  
  stopAlpacaStream() {
    if (!this.isStreaming) {
      console.log('Stream not running');
      return;
    }
    
    console.log('Stopping Alpaca stream...');
    
    if (this.alpacaClient) {
      this.alpacaClient.disconnect();
      this.alpacaClient = null;
    }
    
    this.isStreaming = false;
    this.io.emit('streamStatus', { isStreaming: false });
  }
}

module.exports = StreamServer;