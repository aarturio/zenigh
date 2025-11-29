import { INDICATORS } from "../config.js";
import DatabaseOperations from "../db/db-operations.js";

const TA_SERVICE_URL = process.env.TA_SERVICE_URL;

class IndicatorService {
  /**
   * Calculate all indicators for a symbol/timeframe using all available data
   * @param {string} symbol - Stock symbol
   * @param {string} timeframe - Timeframe (1T, 5T, 1H, 1D)
   * @returns {Promise<Array>} Array of analysis results per bar
   */
  static async calculateAndSave(symbol, timeframe) {
    try {
      console.log(
        `Calculating technical indicators for ${symbol} (${timeframe})...`
      );

      // Get OHLCV data from database
      const bars = await DatabaseOperations.getMarketData(symbol, timeframe);

      // Transform to TA service format
      const ohlcvData = this.transformToOHLCV(bars);

      // Calculate all indicators via batch request
      const indicatorResults = await this.callTAService(ohlcvData);

      // Structure results per bar with signal interpretation
      const analysisResults = this.structureResults(
        bars,
        indicatorResults,
        symbol,
        timeframe
      );

      // Save to database
      await DatabaseOperations.saveTechnicalAnalysis(analysisResults);

      console.log(
        `Saved ${analysisResults.length} technical analysis records for ${symbol} (${timeframe})`
      );

      return analysisResults;
    } catch (error) {
      console.error(
        `Error calculating indicators for ${symbol} (${timeframe}):`,
        error
      );
      throw error;
    }
  }

  /**
   * Transform database bars to OHLCV format for TA service
   * @param {Array} bars - Array of bar objects from database
   * @returns {Object} OHLCV data
   */
  static transformToOHLCV(bars) {
    return {
      open: bars.map((bar) => parseFloat(bar.open)),
      high: bars.map((bar) => parseFloat(bar.high)),
      low: bars.map((bar) => parseFloat(bar.low)),
      close: bars.map((bar) => parseFloat(bar.close)),
      volume: bars.map((bar) => parseFloat(bar.volume)),
    };
  }

  /**
   * Call TA service to calculate all indicators
   * @param {Object} ohlcvData - OHLCV data
   * @returns {Promise<Object>} Indicator results
   */
  static async callTAService(ohlcvData) {
    const response = await fetch(`${TA_SERVICE_URL}/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: ohlcvData,
        params: INDICATORS,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`TA service error response:`, errorText);
      throw new Error(`TA service error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.results;
  }

  /**
   * Structure indicator results into the desired format per bar
   * @param {Array} bars - Original bars
   * @param {Object} indicatorResults - Raw indicator results from TA service
   * @param {string} symbol - Stock symbol
   * @param {string} timeframe - Timeframe
   * @returns {Array} Structured analysis results
   */
  static structureResults(bars, indicatorResults, symbol, timeframe) {
    const results = [];

    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i];

      // Build indicators object with unified param-based structure
      const indicators = {
        momentum: {
          rsi: {
            14: this.getValueAt(indicatorResults.RSI?.values, i),
          },
          stochastic: {
            "14_3": {
              k: this.getValueAt(indicatorResults.STOCH?.k, i),
              d: this.getValueAt(indicatorResults.STOCH?.d, i),
            },
          },
        },
        trend: {
          sma: {
            5: this.getValueAt(indicatorResults.SMA5?.values, i),
            8: this.getValueAt(indicatorResults.SMA8?.values, i),
            10: this.getValueAt(indicatorResults.SMA10?.values, i),
            13: this.getValueAt(indicatorResults.SMA13?.values, i),
            20: this.getValueAt(indicatorResults.SMA20?.values, i),
            34: this.getValueAt(indicatorResults.SMA34?.values, i),
            50: this.getValueAt(indicatorResults.SMA50?.values, i),
            100: this.getValueAt(indicatorResults.SMA100?.values, i),
            150: this.getValueAt(indicatorResults.SMA150?.values, i),
            200: this.getValueAt(indicatorResults.SMA200?.values, i),
          },
          ema: {
            5: this.getValueAt(indicatorResults.EMA5?.values, i),
            8: this.getValueAt(indicatorResults.EMA8?.values, i),
            10: this.getValueAt(indicatorResults.EMA10?.values, i),
            13: this.getValueAt(indicatorResults.EMA13?.values, i),
            20: this.getValueAt(indicatorResults.EMA20?.values, i),
            34: this.getValueAt(indicatorResults.EMA34?.values, i),
            50: this.getValueAt(indicatorResults.EMA50?.values, i),
            100: this.getValueAt(indicatorResults.EMA100?.values, i),
            150: this.getValueAt(indicatorResults.EMA150?.values, i),
            200: this.getValueAt(indicatorResults.EMA200?.values, i),
          },
          macd: {
            "12_26_9": {
              value: this.getValueAt(indicatorResults.MACD?.macd, i),
              signal: this.getValueAt(indicatorResults.MACD?.signal, i),
              histogram: this.getValueAt(indicatorResults.MACD?.histogram, i),
            },
          },
          adx: {
            14: this.getValueAt(indicatorResults.ADX?.values, i),
          },
          cci: {
            14: this.getValueAt(indicatorResults.CCI?.values, i),
          },
        },
        volatility: {
          bbands: {
            "20_2.0": {
              upper: this.getValueAt(indicatorResults.BBANDS?.upper, i),
              middle: this.getValueAt(indicatorResults.BBANDS?.middle, i),
              lower: this.getValueAt(indicatorResults.BBANDS?.lower, i),
            },
          },
          atr: {
            14: this.getValueAt(indicatorResults.ATR?.values, i),
          },
        },
        volume: {
          obv: {
            default: this.getValueAt(indicatorResults.OBV?.values, i),
          },
        },
      };

      results.push({
        symbol,
        timeframe,
        timestamp: bar.timestamp,
        indicators,
        dataPointsUsed: bars.length,
      });
    }

    return results;
  }

  /**
   * Safely get value at index
   * @param {Array} arr - Array of values
   * @param {number} index - Index
   * @returns {number|null} Value or null
   */
  static getValueAt(arr, index) {
    if (!arr || index < 0 || index >= arr.length) return null;
    const value = arr[index];
    return value !== null && !isNaN(value) ? value : null;
  }

  /**
   * Get RSI signal
   * @param {number} rsi - RSI value
   * @returns {string} Signal: overbought, oversold, neutral
   */
  static getRSISignal(rsi) {
    if (rsi === null) return "neutral";
    if (rsi > 70) return "overbought";
    if (rsi < 30) return "oversold";
    return "neutral";
  }

  /**
   * Get Stochastic signal
   * @param {number} k - K value
   * @param {number} d - D value
   * @returns {string} Signal
   */
  static getStochasticSignal(k, d) {
    if (k === null || d === null) return "neutral";
    if (k > 80) return "overbought";
    if (k < 20) return "oversold";
    return "neutral";
  }

  /**
   * Get MACD crossover signal
   * @param {number} macd - Current MACD
   * @param {number} signal - Current signal
   * @param {number} prevMacd - Previous MACD
   * @param {number} prevSignal - Previous signal
   * @returns {string} Crossover type
   */
  static getMACDCrossover(macd, signal, prevMacd, prevSignal) {
    if (
      macd === null ||
      signal === null ||
      prevMacd === null ||
      prevSignal === null
    ) {
      return "none";
    }

    if (prevMacd <= prevSignal && macd > signal) {
      return "bullish";
    }
    if (prevMacd >= prevSignal && macd < signal) {
      return "bearish";
    }
    return "none";
  }

  /**
   * Get Bollinger Band position
   * @param {number} price - Current price
   * @param {number} upper - Upper band
   * @param {number} middle - Middle band
   * @param {number} lower - Lower band
   * @returns {string} Position
   */
  static getBBPosition(price, upper, middle, lower) {
    if (price === null || upper === null || middle === null || lower === null) {
      return "mid";
    }

    if (price >= upper) return "upper";
    if (price <= lower) return "lower";
    return "mid";
  }

  /**
   * Generate overall signals
   * @param {Object} indicators - All indicators
   * @returns {Object} Signals
   */
  static generateSignals(indicators) {
    const alerts = [];

    // RSI alerts
    if (indicators.momentum.rsi.signal === "overbought") {
      alerts.push("RSI approaching overbought");
    } else if (indicators.momentum.rsi.signal === "oversold") {
      alerts.push("RSI approaching oversold");
    }

    // MACD alerts
    if (indicators.trend.macd.crossover === "bullish") {
      alerts.push("MACD bullish crossover");
    } else if (indicators.trend.macd.crossover === "bearish") {
      alerts.push("MACD bearish crossover");
    }

    // BB position alerts
    if (indicators.volatility.bollingerBands.position === "upper") {
      alerts.push("Price at upper Bollinger Band");
    } else if (indicators.volatility.bollingerBands.position === "lower") {
      alerts.push("Price at lower Bollinger Band");
    }

    // Overall sentiment
    let bullishCount = 0;
    let bearishCount = 0;

    if (indicators.momentum.rsi.signal === "oversold") bullishCount++;
    if (indicators.momentum.rsi.signal === "overbought") bearishCount++;
    if (indicators.trend.macd.crossover === "bullish") bullishCount++;
    if (indicators.trend.macd.crossover === "bearish") bearishCount++;

    let overall = "neutral";
    if (bullishCount > bearishCount) overall = "bullish";
    else if (bearishCount > bullishCount) overall = "bearish";

    const strength =
      Math.abs(bullishCount - bearishCount) >= 2 ? "strong" : "moderate";

    return {
      overall,
      strength,
      alerts,
    };
  }
}

export default IndicatorService;
