import {
  calculateRSI,
  getRSISignal,
  calculateMACD,
  getMACDSignal,
  detectMACDCrossover,
  calculateMovingAverages,
  calculateExponentialMovingAverages,
} from '../../services/indicators/index.js';

/**
 * Real-time indicator calculator for streaming data
 * Maintains a sliding window of bars and calculates indicators incrementally
 */
class IndicatorCalculator {
  constructor(config = {}) {
    this.config = {
      RSI: { period: 14, overbought: 70, oversold: 30 },
      SMA: [20, 50, 200],
      EMA: [12, 26],
      MACD: { fast: 12, slow: 26, signal: 9 },
      windowSize: 200, // Keep 200 bars for calculations
      ...config,
    };

    this.barWindow = []; // Sliding window of OHLCV bars
  }

  /**
   * Initialize with historical data
   * @param {Array} historicalBars - Array of {timestamp, open, high, low, close, volume}
   */
  initialize(historicalBars) {
    this.barWindow = historicalBars.slice(-this.config.windowSize);
  }

  /**
   * Add new bar and calculate indicators
   * @param {Object} newBar - {timestamp, open, high, low, close, volume}
   * @returns {Object} Calculated indicators
   */
  addBarAndCalculate(newBar) {
    // Add new bar to window
    this.barWindow.push(newBar);

    // Maintain window size
    if (this.barWindow.length > this.config.windowSize) {
      this.barWindow.shift();
    }

    // Calculate indicators
    return this.calculateIndicators();
  }

  /**
   * Calculate all configured indicators from current window
   * @returns {Object} Indicator values
   */
  calculateIndicators() {
    const close = this.barWindow.map((b) => b.close);
    const high = this.barWindow.map((b) => b.high);
    const low = this.barWindow.map((b) => b.low);
    const volume = this.barWindow.map((b) => b.volume);

    const indicators = {
      timestamp: this.barWindow[this.barWindow.length - 1].timestamp,
    };

    // Calculate RSI
    if (close.length >= this.config.RSI.period + 1) {
      const rsiValues = calculateRSI(close, this.config.RSI.period);
      const currentRSI = rsiValues[rsiValues.length - 1];

      indicators.rsi = {
        value: parseFloat(currentRSI.toFixed(2)),
        signal: getRSISignal(currentRSI, {
          overbought: this.config.RSI.overbought,
          oversold: this.config.RSI.oversold,
        }),
      };
    }

    // Calculate MACD
    const macdMinLength = this.config.MACD.slow + this.config.MACD.signal;
    if (close.length >= macdMinLength) {
      const macdValues = calculateMACD(close, this.config.MACD);
      const current = macdValues[macdValues.length - 1];
      const crossover = detectMACDCrossover(macdValues);

      indicators.macd = {
        value: parseFloat(current.macd.toFixed(4)),
        signal: parseFloat(current.signal.toFixed(4)),
        histogram: parseFloat(current.histogram.toFixed(4)),
        crossover,
        trend: getMACDSignal(current).trend,
      };
    }

    // Calculate SMAs
    if (close.length >= Math.max(...this.config.SMA)) {
      const smaValues = calculateMovingAverages(close, this.config.SMA);
      indicators.sma = {};

      Object.keys(smaValues).forEach((key) => {
        if (smaValues[key] !== null) {
          indicators.sma[key] = parseFloat(smaValues[key].toFixed(2));
        }
      });
    }

    // Calculate EMAs
    if (close.length >= Math.max(...this.config.EMA)) {
      const emaValues = calculateExponentialMovingAverages(
        close,
        this.config.EMA
      );
      indicators.ema = {};

      Object.keys(emaValues).forEach((key) => {
        if (emaValues[key] !== null) {
          indicators.ema[key] = parseFloat(emaValues[key].toFixed(2));
        }
      });
    }

    return indicators;
  }

  /**
   * Reset the calculator (e.g., when switching symbols)
   */
  reset() {
    this.barWindow = [];
  }

  /**
   * Get current window size
   * @returns {number}
   */
  getWindowSize() {
    return this.barWindow.length;
  }
}

export default IndicatorCalculator;
