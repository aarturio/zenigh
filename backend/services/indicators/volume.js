import { calculateSMA } from './utils.js';

/**
 * Calculate Volume Moving Average
 * @param {number[]} volumeData - Array of volume values
 * @param {number|number[]} periods - Single period or array of periods [20, 50]
 * @returns {object|number[]} Object with periods as keys or single array
 */
function calculateVolumeMA(volumeData, periods = [20, 50]) {
  if (typeof periods === 'number') {
    return calculateSMA(volumeData, periods);
  }

  const result = {};
  for (const period of periods) {
    if (volumeData.length >= period) {
      const sma = calculateSMA(volumeData, period);
      // Return the most recent value
      result[period] = sma[sma.length - 1];
    } else {
      result[period] = null; // Insufficient data for this period
    }
  }

  return result;
}

/**
 * Calculate OBV (On-Balance Volume)
 * @param {object[]} data - Array of {close, volume} objects
 * @returns {number[]} Array of OBV values (cumulative)
 */
function calculateOBV(data) {
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error('Need at least 2 data points to calculate OBV');
  }

  const obvValues = [];
  let obv = 0;

  // First value: start with volume if price increased, else negative volume
  obvValues.push(data[0].volume);
  obv = data[0].volume;

  // Calculate OBV for remaining values
  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const previous = data[i - 1];

    if (current.close > previous.close) {
      // Price up: add volume
      obv += current.volume;
    } else if (current.close < previous.close) {
      // Price down: subtract volume
      obv -= current.volume;
    }
    // If price unchanged, OBV stays the same

    obvValues.push(obv);
  }

  return obvValues;
}

/**
 * Analyze volume relative to average
 * @param {number} currentVolume - Current volume
 * @param {number} averageVolume - Average volume (from VMA)
 * @returns {object} Volume analysis
 */
function analyzeVolume(currentVolume, averageVolume) {
  const ratio = currentVolume / averageVolume;

  let level;
  if (ratio >= 2.0) level = 'extremely_high';
  else if (ratio >= 1.5) level = 'high';
  else if (ratio >= 0.75) level = 'normal';
  else if (ratio >= 0.5) level = 'low';
  else level = 'extremely_low';

  return {
    level,
    ratio,
    aboveAverage: currentVolume > averageVolume,
    percentageOfAverage: (ratio * 100).toFixed(2)
  };
}

/**
 * Detect volume spikes
 * @param {number[]} volumeData - Array of volume values
 * @param {number} threshold - Spike threshold multiplier (default 2.0)
 * @returns {number[]} Indices where spikes occurred
 */
function detectVolumeSpikes(volumeData, threshold = 2.0) {
  if (volumeData.length < 20) {
    return []; // Not enough data
  }

  const spikes = [];
  const period = 20;

  for (let i = period; i < volumeData.length; i++) {
    // Calculate average volume for previous period
    const window = volumeData.slice(i - period, i);
    const avgVolume = window.reduce((sum, vol) => sum + vol, 0) / period;

    // Check if current volume is a spike
    if (volumeData[i] >= avgVolume * threshold) {
      spikes.push(i);
    }
  }

  return spikes;
}

/**
 * Calculate volume trend using OBV slope
 * @param {number[]} obvData - Array of OBV values
 * @param {number} lookback - Number of periods to analyze (default 10)
 * @returns {string} Trend: 'rising', 'falling', 'flat'
 */
function getVolumeTrend(obvData, lookback = 10) {
  if (obvData.length < lookback) {
    return 'flat'; // Not enough data
  }

  const recentOBV = obvData.slice(-lookback);
  const start = recentOBV[0];
  const end = recentOBV[recentOBV.length - 1];

  const change = ((end - start) / Math.abs(start)) * 100;

  if (change > 5) return 'rising';
  if (change < -5) return 'falling';
  return 'flat';
}

/**
 * Get volume confirmation for price move
 * @param {object} priceData - {current, previous} close prices
 * @param {object} volumeData - {current, average} volume
 * @returns {object} Confirmation analysis
 */
function getVolumeConfirmation(priceData, volumeData) {
  const priceUp = priceData.current > priceData.previous;
  const volumeHigh = volumeData.current > volumeData.average;

  let confirmation;
  if (priceUp && volumeHigh) {
    confirmation = 'strong_bullish'; // Price up on high volume = strong
  } else if (priceUp && !volumeHigh) {
    confirmation = 'weak_bullish'; // Price up on low volume = weak
  } else if (!priceUp && volumeHigh) {
    confirmation = 'strong_bearish'; // Price down on high volume = strong
  } else {
    confirmation = 'weak_bearish'; // Price down on low volume = weak
  }

  return {
    confirmation,
    volumeSupported: (priceUp && volumeHigh) || (!priceUp && volumeHigh)
  };
}

export {
  calculateVolumeMA,
  calculateOBV,
  analyzeVolume,
  detectVolumeSpikes,
  getVolumeTrend,
  getVolumeConfirmation
};
