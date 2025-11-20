import { SYMBOLS } from "../config.js";

class CoreDataClient {
  constructor() {
    this.keyId = process.env.ALPACA_API_KEY;
    this.secretKey = process.env.ALPACA_SECRET_KEY;
    this.feed = "iex";
    this.symbols = SYMBOLS.join("%2C");
  }

  async getBars(start, end, timeframe, page_token = null) {
    const baseUrl = `https://data.alpaca.markets/v2/stocks/bars?symbols=${this.symbols}&timeframe=${timeframe}&start=${start}&end=${end}&limit=10000&adjustment=raw&feed=${this.feed}&sort=asc`;

    const url = page_token ? baseUrl + `&page_token=${page_token}` : baseUrl;

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
  async getData(startDate, endDate, timeframe) {
    const allBars = {};
    let nextPageToken = null;
    let pageCount = 0;

    do {
      const page = await this.getBars(
        startDate,
        endDate,
        timeframe,
        nextPageToken
      );

      // Merge bars efficiently using push
      for (const symbol in page.bars) {
        if (!allBars[symbol]) {
          allBars[symbol] = [];
        }
        allBars[symbol].push(...page.bars[symbol]);
      }

      nextPageToken = page.next_page_token;
      pageCount++;

      if (nextPageToken) {
        console.log(`Fetched page ${pageCount}, continuing...`);
      } else {
        console.log(`Completed: fetched ${pageCount} page(s)`);
      }
    } while (nextPageToken);

    return allBars;
  }
}

const coreDataClient = new CoreDataClient();
export default coreDataClient;
