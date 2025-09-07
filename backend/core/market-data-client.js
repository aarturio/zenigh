// const stocks = require("../stocks.json");
import stocks from "../stocks.json" with { type: "json" };

class MarketDataClient {
  constructor() {
    this.keyId = process.env.ALPACA_API_KEY;
    this.secretKey = process.env.ALPACA_SECRET_KEY;
    this.feed = "iex";
    this.symbols = stocks.join("%2C");
  }

  async getBars(start, end, page_token = null, timeframe = "1H") {
    let baseUrl = `https://data.alpaca.markets/v2/stocks/bars?symbols=${this.symbols}&timeframe=${timeframe}&start=${start}&end=${end}&limit=10000&adjustment=raw&feed=${this.feed}&sort=asc`;

    let url = page_token ? baseUrl + `&page_token=${page_token}` : baseUrl;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "APCA-API-KEY-ID": this.keyId,
          "APCA-API-SECRET-KEY": this.secretKey,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error making request:", error);
      throw error;
    }
  }
}
const marketDataClient = new MarketDataClient();

// module.exports = marketDataClient;
export default marketDataClient;
