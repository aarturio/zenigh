import { calculateSMA, calculateEMA } from './utils.js';

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param {number[]} data - Array of price values (typically closing prices)
 * @param {object} config - Configuration {fast: 12, slow: 26, signal: 9}
 * @returns {object[]} Array of {macd, signal, histogram} objects
 */
function calculateMACD(data, config = { fast: 12, slow: 26, signal: 9 }) {
  const { fast, slow, signal } = config;

  // Need enough data for the slow EMA
  if (data.length < slow + signal) {
    throw new Error(
      `Insufficient data: need ${slow + signal} points, got ${data.length}`
    );
  }

  // Step 1: Calculate fast and slow EMAs
  const fastEMA = calculateEMA(data, fast);
  const slowEMA = calculateEMA(data, slow);

  // Step 2: Calculate MACD line (fast EMA - slow EMA)
  // Note: slowEMA starts later, so we need to align arrays
  const offset = slow - fast; // slowEMA is shorter by this amount
  const macdLine = [];

  for (let i = 0; i < slowEMA.length; i++) {
    macdLine.push(fastEMA[i + offset] - slowEMA[i]);
  }

  // Step 3: Calculate signal line (EMA of MACD line)
  const signalLine = calculateEMA(macdLine, signal);

  // Step 4: Calculate histogram (MACD - Signal)
  // signalLine starts later, so align with macdLine
  const signalOffset = signal - 1;
  const result = [];

  for (let i = 0; i < signalLine.length; i++) {
    const macd = macdLine[i + signalOffset];
    const sig = signalLine[i];
    const histogram = macd - sig;

    result.push({
      macd,
      signal: sig,
      histogram
    });
  }

  return result;
}

/**
 * Detect MACD crossovers
 * @param {object[]} macdData - Array of MACD objects from calculateMACD
 * @returns {string} 'bullish', 'bearish', or 'none'
 */
function detectMACDCrossover(macdData) {
  if (macdData.length < 2) {
    return 'none';
  }

  const current = macdData[macdData.length - 1];
  const previous = macdData[macdData.length - 2];

  // Bullish crossover: MACD crosses above Signal
  if (previous.macd < previous.signal && current.macd >= current.signal) {
    return 'bullish';
  }

  // Bearish crossover: MACD crosses below Signal
  if (previous.macd > previous.signal && current.macd <= current.signal) {
    return 'bearish';
  }

  return 'none';
}

/**
 * Get MACD signal interpretation
 * @param {object} macd - Single MACD object {macd, signal, histogram}
 * @returns {object} Signal interpretation
 */
function getMACDSignal(macd) {
  const { macd: macdValue, signal: signalValue, histogram } = macd;

  return {
    trend: macdValue > signalValue ? 'bullish' : 'bearish',
    strength: Math.abs(histogram) > 1 ? 'strong' : 'weak',
    momentum: histogram > 0 ? 'positive' : 'negative'
  };
}

/**
 * Calculate Simple Moving Average with period selection
 * @param {number[]} data - Array of price values
 * @param {number|number[]} periods - Single period or array of periods [20, 50, 200]
 * @returns {object|number[]} Object with periods as keys or single array
 */
function calculateMovingAverages(data, periods = [20, 50, 200]) {
  if (typeof periods === 'number') {
    return calculateSMA(data, periods);
  }

  const result = {};
  for (const period of periods) {
    if (data.length >= period) {
      const sma = calculateSMA(data, period);
      // Return the most recent value
      result[period] = sma[sma.length - 1];
    } else {
      result[period] = null; // Insufficient data for this period
    }
  }

  return result;
}

/**
 * Calculate Exponential Moving Averages with period selection
 * @param {number[]} data - Array of price values
 * @param {number|number[]} periods - Single period or array of periods [12, 26]
 * @returns {object|number[]} Object with periods as keys or single array
 */
function calculateExponentialMovingAverages(data, periods = [12, 26]) {
  if (typeof periods === 'number') {
    return calculateEMA(data, periods);
  }

  const result = {};
  for (const period of periods) {
    if (data.length >= period) {
      const ema = calculateEMA(data, period);
      // Return the most recent value
      result[period] = ema[ema.length - 1];
    } else {
      result[period] = null; // Insufficient data for this period
    }
  }

  return result;
}

export {
  calculateMACD,
  detectMACDCrossover,
  getMACDSignal,
  calculateMovingAverages,
  calculateExponentialMovingAverages
};
