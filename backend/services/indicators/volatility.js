import { calculateSMA, calculateStdDev } from './utils.js';

/**
 * Calculate Bollinger Bands
 * @param {number[]} data - Array of price values (typically closing prices)
 * @param {object} config - Configuration {period: 20, stdDev: 2}
 * @returns {object[]} Array of {upper, middle, lower} band values
 */
function calculateBollingerBands(data, config = { period: 20, stdDev: 2 }) {
  const { period, stdDev: stdDevMultiplier } = config;

  if (data.length < period) {
    throw new Error(
      `Insufficient data: need ${period} points, got ${data.length}`
    );
  }

  // Calculate middle band (SMA)
  const middleBand = calculateSMA(data, period);

  // Calculate standard deviation
  const stdDevValues = calculateStdDev(data, period);

  // Calculate upper and lower bands
  const result = [];
  for (let i = 0; i < middleBand.length; i++) {
    const middle = middleBand[i];
    const stdDev = stdDevValues[i];

    result.push({
      upper: middle + (stdDev * stdDevMultiplier),
      middle: middle,
      lower: middle - (stdDev * stdDevMultiplier)
    });
  }

  return result;
}

/**
 * Get Bollinger Bands position for a price
 * @param {number} price - Current price
 * @param {object} bands - Bollinger Bands {upper, middle, lower}
 * @returns {string} Position: 'above_upper', 'upper', 'middle', 'lower', 'below_lower'
 */
function getBollingerPosition(price, bands) {
  const { upper, middle, lower } = bands;
  const upperThreshold = middle + (upper - middle) * 0.8;
  const lowerThreshold = middle - (middle - lower) * 0.8;

  if (price > upper) return 'above_upper';
  if (price > upperThreshold) return 'upper';
  if (price < lower) return 'below_lower';
  if (price < lowerThreshold) return 'lower';
  return 'middle';
}

/**
 * Calculate True Range for a single period
 * @param {object} current - Current bar {high, low, close}
 * @param {object} previous - Previous bar {high, low, close}
 * @returns {number} True Range value
 */
function calculateTrueRange(current, previous) {
  if (!previous) {
    // First bar: true range is just high - low
    return current.high - current.low;
  }

  // True Range is the maximum of:
  // 1. Current high - current low
  // 2. Absolute value of (current high - previous close)
  // 3. Absolute value of (current low - previous close)
  const range1 = current.high - current.low;
  const range2 = Math.abs(current.high - previous.close);
  const range3 = Math.abs(current.low - previous.close);

  return Math.max(range1, range2, range3);
}

/**
 * Calculate ATR (Average True Range)
 * @param {object[]} data - Array of OHLC bars {high, low, close}
 * @param {number} period - Number of periods (typically 14)
 * @returns {number[]} Array of ATR values
 */
function calculateATR(data, period = 14) {
  if (!Array.isArray(data) || data.length < period + 1) {
    throw new Error(
      `Insufficient data: need ${period + 1} bars, got ${data.length}`
    );
  }

  const trueRanges = [];

  // Calculate true range for each bar
  for (let i = 0; i < data.length; i++) {
    const current = data[i];
    const previous = i > 0 ? data[i - 1] : null;
    trueRanges.push(calculateTrueRange(current, previous));
  }

  // Calculate ATR using Wilder's smoothing (similar to RSI)
  const atrValues = [];

  // First ATR is simple average of first 'period' true ranges
  let atr = trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;
  atrValues.push(atr);

  // Subsequent ATR values use Wilder's smoothing
  for (let i = period; i < trueRanges.length; i++) {
    atr = ((atr * (period - 1)) + trueRanges[i]) / period;
    atrValues.push(atr);
  }

  return atrValues;
}

/**
 * Get volatility level based on ATR
 * @param {number} currentATR - Current ATR value
 * @param {number[]} atrHistory - Historical ATR values for comparison
 * @returns {string} Volatility level: 'high', 'normal', 'low'
 */
function getVolatilityLevel(currentATR, atrHistory) {
  if (atrHistory.length < 20) {
    return 'normal'; // Not enough history to determine
  }

  // Calculate average ATR from history
  const avgATR = atrHistory.reduce((sum, val) => sum + val, 0) / atrHistory.length;

  // Current ATR is high if it's 50% above average
  if (currentATR > avgATR * 1.5) return 'high';

  // Current ATR is low if it's 50% below average
  if (currentATR < avgATR * 0.5) return 'low';

  return 'normal';
}

/**
 * Calculate Bollinger Band Width (volatility measure)
 * @param {object} bands - Bollinger Bands {upper, middle, lower}
 * @returns {number} Band width percentage
 */
function calculateBandWidth(bands) {
  const { upper, middle, lower } = bands;
  return ((upper - lower) / middle) * 100;
}

export {
  calculateBollingerBands,
  getBollingerPosition,
  calculateATR,
  calculateTrueRange,
  getVolatilityLevel,
  calculateBandWidth
};
