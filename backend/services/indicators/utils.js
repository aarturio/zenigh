/**
 * Calculate Simple Moving Average (SMA)
 * @param {number[]} data - Array of price values (typically closing prices)
 * @param {number} period - Number of periods to average
 * @returns {number[]} Array of SMA values (shorter than input by period-1)
 */
function calculateSMA(data, period) {
  validateDataLength(data, period);

  const result = [];

  // Sliding window: start at position where we have enough data points
  for (let i = period - 1; i < data.length; i++) {
    // Get slice of 'period' data points ending at current position
    const window = data.slice(i - period + 1, i + 1);

    // Calculate average
    const sum = window.reduce((acc, val) => acc + val, 0);
    const average = sum / period;

    result.push(average);
  }

  return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 * @param {number[]} data - Array of price values (typically closing prices)
 * @param {number} period - Number of periods for the EMA
 * @returns {number[]} Array of EMA values (shorter than input by period-1)
 */
function calculateEMA(data, period) {
  validateDataLength(data, period);

  const result = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA for the first value
  const firstWindow = data.slice(0, period);
  const firstSMA = firstWindow.reduce((acc, val) => acc + val, 0) / period;
  result.push(firstSMA);

  // Calculate EMA for remaining values
  for (let i = period; i < data.length; i++) {
    const ema = (data[i] - result[result.length - 1]) * multiplier + result[result.length - 1];
    result.push(ema);
  }

  return result;
}

/**
 * Calculate rolling Standard Deviation
 * @param {number[]} data - Array of price values
 * @param {number} period - Number of periods for standard deviation window
 * @returns {number[]} Array of standard deviation values (shorter than input by period-1)
 */
function calculateStdDev(data, period) {
  validateDataLength(data, period);

  const result = [];

  // Sliding window for standard deviation
  for (let i = period - 1; i < data.length; i++) {
    const window = data.slice(i - period + 1, i + 1);

    // Calculate mean of window
    const mean = window.reduce((acc, val) => acc + val, 0) / period;

    // Calculate sum of squared differences
    const squaredDiffs = window.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / period;

    // Standard deviation is square root of variance
    const stdDev = Math.sqrt(variance);
    result.push(stdDev);
  }

  return result;
}

/**
 * Calculate period-over-period changes (deltas)
 * @param {number[]} data - Array of price values
 * @returns {number[]} Array of changes (shorter than input by 1)
 */
function calculateChanges(data) {
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error('Need at least 2 data points to calculate changes');
  }

  const changes = [];

  for (let i = 1; i < data.length; i++) {
    changes.push(data[i] - data[i - 1]);
  }

  return changes;
}

/**
 * Validate that we have enough data points for the calculation
 * @param {number[]} data - Array of data points
 * @param {number} requiredPeriod - Minimum number of data points needed
 * @throws {Error} If insufficient data
 */
function validateDataLength(data, requiredPeriod) {
  if (!Array.isArray(data)) {
    throw new Error("Data must be an array");
  }

  if (data.length < requiredPeriod) {
    throw new Error(
      `Insufficient data: need ${requiredPeriod} points, got ${data.length}`
    );
  }

  if (data.some((val) => typeof val !== "number" || isNaN(val))) {
    throw new Error("Data must contain only valid numbers");
  }
}

// Export functions
export {
  calculateSMA,
  calculateEMA,
  calculateStdDev,
  calculateChanges,
  validateDataLength,
};
