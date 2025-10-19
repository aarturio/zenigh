import {
  calculateRSI,
  getRSISignal,
  calculateStochastic,
  getStochasticSignal,
  calculateMACD,
  detectMACDCrossover,
  getMACDSignal,
  calculateMovingAverages,
  calculateExponentialMovingAverages,
  calculateBollingerBands,
  getBollingerPosition,
  calculateATR,
  getVolatilityLevel,
  calculateBandWidth,
  calculateVolumeMA,
  calculateOBV,
  analyzeVolume,
  getVolumeTrend,
  getVolumeConfirmation,
} from './indicators/index.js';

/**
 * Default configuration for technical indicators
 */
const DEFAULT_CONFIG = {
  RSI: { period: 14, overbought: 70, oversold: 30 },
  STOCHASTIC: { kPeriod: 14, dPeriod: 3, overbought: 80, oversold: 20 },
  SMA: [20, 50, 200],
  EMA: [12, 26],
  MACD: { fast: 12, slow: 26, signal: 9 },
  BOLLINGER: { period: 20, stdDev: 2 },
  ATR: { period: 14 },
  VOLUME_MA: [20, 50],
};

class IndicatorsManager {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Calculate all technical indicators for given data
   * @param {object} marketData - Market data with arrays of OHLCV
   * @param {object} options - Optional configuration overrides
   * @returns {object} Complete indicators object
   */
  calculateAll(marketData, options = {}) {
    const config = { ...this.config, ...options };

    // Validate data
    this._validateMarketData(marketData);

    const { close, high, low, volume, timestamp } = marketData;

    // Prepare result object
    const result = {
      timestamp: timestamp[timestamp.length - 1],
      dataPoints: close.length,
      indicators: {},
      signals: {
        overall: null,
        strength: null,
        alerts: [],
      },
    };

    try {
      // Calculate Momentum Indicators
      result.indicators.momentum = this._calculateMomentumIndicators(
        { close, high, low },
        config
      );

      // Calculate Trend Indicators
      result.indicators.trend = this._calculateTrendIndicators(close, config);

      // Calculate Volatility Indicators
      result.indicators.volatility = this._calculateVolatilityIndicators(
        { close, high, low },
        config
      );

      // Calculate Volume Indicators
      result.indicators.volume = this._calculateVolumeIndicators(
        { close, volume },
        config
      );

      // Generate overall signals
      result.signals = this._generateSignals(result.indicators, { close, volume });

      return result;
    } catch (error) {
      throw new Error(`Indicator calculation failed: ${error.message}`);
    }
  }

  /**
   * Calculate momentum indicators (RSI, Stochastic)
   * @private
   */
  _calculateMomentumIndicators(data, config) {
    const { close, high, low } = data;
    const momentum = {};

    // RSI
    if (close.length >= config.RSI.period + 1) {
      const rsiValues = calculateRSI(close, config.RSI.period);
      const currentRSI = rsiValues[rsiValues.length - 1];

      momentum.rsi = {
        value: parseFloat(currentRSI.toFixed(2)),
        signal: getRSISignal(currentRSI, {
          overbought: config.RSI.overbought,
          oversold: config.RSI.oversold,
        }),
      };
    }

    // Stochastic
    if (close.length >= config.STOCHASTIC.kPeriod + config.STOCHASTIC.dPeriod) {
      const ohlcData = close.map((c, i) => ({
        high: high[i],
        low: low[i],
        close: c,
      }));

      const stochValues = calculateStochastic(
        ohlcData,
        config.STOCHASTIC.kPeriod,
        config.STOCHASTIC.dPeriod
      );

      const current = stochValues[stochValues.length - 1];

      momentum.stochastic = {
        k: parseFloat(current.k.toFixed(2)),
        d: parseFloat(current.d.toFixed(2)),
        signal: getStochasticSignal(current.k, current.d, {
          overbought: config.STOCHASTIC.overbought,
          oversold: config.STOCHASTIC.oversold,
        }),
      };
    }

    return momentum;
  }

  /**
   * Calculate trend indicators (SMA, EMA, MACD)
   * @private
   */
  _calculateTrendIndicators(close, config) {
    const trend = {};

    // SMA
    if (close.length >= Math.max(...config.SMA)) {
      trend.sma = calculateMovingAverages(close, config.SMA);

      // Round values
      Object.keys(trend.sma).forEach(key => {
        if (trend.sma[key] !== null) {
          trend.sma[key] = parseFloat(trend.sma[key].toFixed(2));
        }
      });
    }

    // EMA
    if (close.length >= Math.max(...config.EMA)) {
      trend.ema = calculateExponentialMovingAverages(close, config.EMA);

      // Round values
      Object.keys(trend.ema).forEach(key => {
        if (trend.ema[key] !== null) {
          trend.ema[key] = parseFloat(trend.ema[key].toFixed(2));
        }
      });
    }

    // MACD
    const macdMinLength = config.MACD.slow + config.MACD.signal;
    if (close.length >= macdMinLength) {
      const macdValues = calculateMACD(close, config.MACD);
      const current = macdValues[macdValues.length - 1];
      const crossover = detectMACDCrossover(macdValues);
      const signal = getMACDSignal(current);

      trend.macd = {
        value: parseFloat(current.macd.toFixed(4)),
        signal: parseFloat(current.signal.toFixed(4)),
        histogram: parseFloat(current.histogram.toFixed(4)),
        crossover,
        ...signal,
      };
    }

    return trend;
  }

  /**
   * Calculate volatility indicators (Bollinger Bands, ATR)
   * @private
   */
  _calculateVolatilityIndicators(data, config) {
    const { close, high, low } = data;
    const volatility = {};

    // Bollinger Bands
    if (close.length >= config.BOLLINGER.period) {
      const bbValues = calculateBollingerBands(close, config.BOLLINGER);
      const current = bbValues[bbValues.length - 1];
      const currentPrice = close[close.length - 1];

      volatility.bollingerBands = {
        upper: parseFloat(current.upper.toFixed(2)),
        middle: parseFloat(current.middle.toFixed(2)),
        lower: parseFloat(current.lower.toFixed(2)),
        position: getBollingerPosition(currentPrice, current),
        width: parseFloat(calculateBandWidth(current).toFixed(2)),
      };
    }

    // ATR
    if (close.length >= config.ATR.period + 1) {
      const ohlcData = close.map((c, i) => ({
        high: high[i],
        low: low[i],
        close: c,
      }));

      const atrValues = calculateATR(ohlcData, config.ATR.period);
      const currentATR = atrValues[atrValues.length - 1];

      volatility.atr = {
        value: parseFloat(currentATR.toFixed(4)),
        level: getVolatilityLevel(currentATR, atrValues),
      };
    }

    return volatility;
  }

  /**
   * Calculate volume indicators (Volume MA, OBV)
   * @private
   */
  _calculateVolumeIndicators(data, config) {
    const { close, volume } = data;
    const volumeIndicators = {};

    // Volume Moving Averages
    if (volume.length >= Math.max(...config.VOLUME_MA)) {
      const vma = calculateVolumeMA(volume, config.VOLUME_MA);

      // Round values
      Object.keys(vma).forEach(key => {
        if (vma[key] !== null) {
          vma[key] = parseFloat(vma[key].toFixed(0));
        }
      });

      const currentVolume = volume[volume.length - 1];
      const avgVolume = vma[config.VOLUME_MA[0]];

      volumeIndicators.current = currentVolume;
      volumeIndicators.averages = vma;

      if (avgVolume !== null) {
        const analysis = analyzeVolume(currentVolume, avgVolume);
        volumeIndicators.analysis = {
          level: analysis.level,
          aboveAverage: analysis.aboveAverage,
          ratio: parseFloat(analysis.ratio.toFixed(2)),
        };
      }
    }

    // OBV
    if (close.length >= 2 && volume.length >= 2) {
      const obvData = close.map((c, i) => ({
        close: c,
        volume: volume[i],
      }));

      const obvValues = calculateOBV(obvData);
      const currentOBV = obvValues[obvValues.length - 1];

      volumeIndicators.obv = {
        value: parseFloat(currentOBV.toFixed(0)),
        trend: getVolumeTrend(obvValues, Math.min(10, obvValues.length)),
      };

      // Volume confirmation for price move
      if (close.length >= 2 && volumeIndicators.averages) {
        const confirmation = getVolumeConfirmation(
          {
            current: close[close.length - 1],
            previous: close[close.length - 2],
          },
          {
            current: volume[volume.length - 1],
            average: volumeIndicators.averages[config.VOLUME_MA[0]],
          }
        );

        volumeIndicators.priceVolumeConfirmation = confirmation.confirmation;
      }
    }

    return volumeIndicators;
  }

  /**
   * Generate overall signals from all indicators
   * @private
   */
  _generateSignals(indicators, data) {
    const alerts = [];
    let bullishCount = 0;
    let bearishCount = 0;

    // Check RSI
    if (indicators.momentum?.rsi) {
      if (indicators.momentum.rsi.signal === 'overbought') {
        alerts.push('RSI approaching overbought territory');
        bearishCount++;
      } else if (indicators.momentum.rsi.signal === 'oversold') {
        alerts.push('RSI in oversold territory');
        bullishCount++;
      }
    }

    // Check Stochastic
    if (indicators.momentum?.stochastic) {
      if (indicators.momentum.stochastic.signal === 'overbought') {
        bearishCount++;
      } else if (indicators.momentum.stochastic.signal === 'oversold') {
        bullishCount++;
      }
    }

    // Check MACD
    if (indicators.trend?.macd) {
      if (indicators.trend.macd.crossover === 'bullish') {
        alerts.push('MACD bullish crossover detected');
        bullishCount += 2; // Crossovers are stronger signals
      } else if (indicators.trend.macd.crossover === 'bearish') {
        alerts.push('MACD bearish crossover detected');
        bearishCount += 2;
      } else if (indicators.trend.macd.trend === 'bullish') {
        bullishCount++;
      } else if (indicators.trend.macd.trend === 'bearish') {
        bearishCount++;
      }
    }

    // Check Bollinger Bands
    if (indicators.volatility?.bollingerBands) {
      const position = indicators.volatility.bollingerBands.position;
      if (position === 'above_upper') {
        alerts.push('Price above upper Bollinger Band');
        bearishCount++;
      } else if (position === 'below_lower') {
        alerts.push('Price below lower Bollinger Band');
        bullishCount++;
      }
    }

    // Check Volume
    if (indicators.volume?.analysis) {
      if (indicators.volume.analysis.level === 'extremely_high') {
        alerts.push('Extremely high volume detected');
      }
    }

    // Determine overall signal
    let overall = 'neutral';
    if (bullishCount > bearishCount + 1) {
      overall = 'bullish';
    } else if (bearishCount > bullishCount + 1) {
      overall = 'bearish';
    }

    // Determine strength
    const totalSignals = bullishCount + bearishCount;
    const dominantCount = Math.max(bullishCount, bearishCount);
    let strength = 'weak';

    if (totalSignals >= 5) {
      if (dominantCount >= totalSignals * 0.7) {
        strength = 'strong';
      } else if (dominantCount >= totalSignals * 0.6) {
        strength = 'moderate';
      }
    }

    return {
      overall,
      strength,
      alerts,
      bullishSignals: bullishCount,
      bearishSignals: bearishCount,
    };
  }

  /**
   * Validate market data has required fields and sufficient length
   * @private
   */
  _validateMarketData(data) {
    const required = ['close', 'high', 'low', 'volume', 'timestamp'];

    for (const field of required) {
      if (!data[field] || !Array.isArray(data[field])) {
        throw new Error(`Missing or invalid field: ${field}`);
      }
    }

    const length = data.close.length;
    if (length < 50) {
      throw new Error(
        `Insufficient data: need at least 50 bars, got ${length}`
      );
    }

    // Verify all arrays are same length
    for (const field of required) {
      if (data[field].length !== length) {
        throw new Error(
          `Data length mismatch: ${field} has ${data[field].length} elements, expected ${length}`
        );
      }
    }
  }

  /**
   * Get cached indicators or calculate new ones
   * @param {string} symbol - Symbol identifier
   * @param {string} timeframe - Timeframe identifier
   * @param {object} marketData - Market data
   * @param {object} options - Calculation options
   * @returns {object} Indicators
   */
  getCachedOrCalculate(symbol, timeframe, marketData, options = {}) {
    const cacheKey = `${symbol}:${timeframe}`;
    const cached = this.cache.get(cacheKey);

    const now = Date.now();

    // Return cached if valid
    if (cached && now - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    // Calculate new
    const indicators = this.calculateAll(marketData, options);

    // Cache result
    this.cache.set(cacheKey, {
      data: indicators,
      timestamp: now,
    });

    return indicators;
  }

  /**
   * Clear cache for specific symbol/timeframe or all
   * @param {string} symbol - Optional symbol to clear
   * @param {string} timeframe - Optional timeframe to clear
   */
  clearCache(symbol = null, timeframe = null) {
    if (symbol && timeframe) {
      this.cache.delete(`${symbol}:${timeframe}`);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get current configuration
   * @returns {object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param {object} newConfig - Configuration updates
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.clearCache(); // Clear cache when config changes
  }
}

// Export singleton instance
const indicatorsManager = new IndicatorsManager();

export default indicatorsManager;
export { IndicatorsManager, DEFAULT_CONFIG };
