import { calculateChanges, validateDataLength } from './utils.js';

/**
 * Calculate RSI (Relative Strength Index)
 * @param {number[]} data - Array of price values (typically closing prices)
 * @param {number} period - Number of periods (typically 14)
 * @returns {number[]} Array of RSI values (0-100)
 */
function calculateRSI(data, period = 14) {
  validateDataLength(data, period + 1); // Need period + 1 for changes

  // Step 1: Calculate price changes
  const changes = calculateChanges(data);

  // Step 2: Separate gains and losses
  const gains = changes.map(change => change > 0 ? change : 0);
  const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);

  const rsiValues = [];

  // Step 3: Calculate first average gain/loss (SMA approach)
  let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;

  // Calculate first RSI value with proper edge case handling
  let firstRSI;
  if (avgLoss === 0 && avgGain === 0) {
    firstRSI = 50; // No movement = neutral
  } else if (avgLoss === 0) {
    firstRSI = 100; // Only gains = maximum RSI
  } else if (avgGain === 0) {
    firstRSI = 0; // Only losses = minimum RSI
  } else {
    const firstRS = avgGain / avgLoss;
    firstRSI = 100 - (100 / (1 + firstRS));
  }
  rsiValues.push(firstRSI);

  // Step 4: Calculate subsequent RSI values using smoothed averages
  for (let i = period; i < changes.length; i++) {
    // Smoothed average: ((previous avg * (period - 1)) + current value) / period
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;

    // Handle edge cases
    let rsi;
    if (avgLoss === 0 && avgGain === 0) {
      rsi = 50; // No movement = neutral
    } else if (avgLoss === 0) {
      rsi = 100; // Only gains = maximum RSI
    } else if (avgGain === 0) {
      rsi = 0; // Only losses = minimum RSI
    } else {
      const rs = avgGain / avgLoss;
      rsi = 100 - (100 / (1 + rs));
    }
    rsiValues.push(rsi);
  }

  return rsiValues;
}

/**
 * Get RSI signal interpretation
 * @param {number} rsi - RSI value (0-100)
 * @param {object} thresholds - Custom thresholds {overbought, oversold}
 * @returns {string} Signal: 'overbought', 'oversold', or 'neutral'
 */
function getRSISignal(rsi, thresholds = { overbought: 70, oversold: 30 }) {
  if (rsi >= thresholds.overbought) {
    return 'overbought';
  }
  if (rsi <= thresholds.oversold) {
    return 'oversold';
  }
  return 'neutral';
}

/**
 * Calculate Stochastic Oscillator
 * @param {object[]} data - Array of OHLC objects with {high, low, close}
 * @param {number} kPeriod - %K period (typically 14)
 * @param {number} dPeriod - %D period (typically 3)
 * @returns {object[]} Array of {k, d} values
 */
function calculateStochastic(data, kPeriod = 14, dPeriod = 3) {
  if (!Array.isArray(data) || data.length < kPeriod) {
    throw new Error(`Insufficient data: need ${kPeriod} points, got ${data.length}`);
  }

  const kValues = [];

  // Calculate %K for each period
  for (let i = kPeriod - 1; i < data.length; i++) {
    const window = data.slice(i - kPeriod + 1, i + 1);

    const highestHigh = Math.max(...window.map(bar => bar.high));
    const lowestLow = Math.min(...window.map(bar => bar.low));
    const currentClose = data[i].close;

    // %K = ((Current Close - Lowest Low) / (Highest High - Lowest Low)) * 100
    const k = lowestLow === highestHigh
      ? 50 // Avoid division by zero, return neutral
      : ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

    kValues.push(k);
  }

  // Calculate %D (SMA of %K)
  const result = [];
  for (let i = dPeriod - 1; i < kValues.length; i++) {
    const dWindow = kValues.slice(i - dPeriod + 1, i + 1);
    const d = dWindow.reduce((sum, val) => sum + val, 0) / dPeriod;

    result.push({
      k: kValues[i],
      d: d
    });
  }

  return result;
}

/**
 * Get Stochastic signal interpretation
 * @param {number} k - %K value
 * @param {number} d - %D value
 * @param {object} thresholds - Custom thresholds {overbought, oversold}
 * @returns {string} Signal: 'overbought', 'oversold', or 'neutral'
 */
function getStochasticSignal(k, d, thresholds = { overbought: 80, oversold: 20 }) {
  if (k >= thresholds.overbought && d >= thresholds.overbought) {
    return 'overbought';
  }
  if (k <= thresholds.oversold && d <= thresholds.oversold) {
    return 'oversold';
  }
  return 'neutral';
}

export {
  calculateRSI,
  getRSISignal,
  calculateStochastic,
  getStochasticSignal
};
