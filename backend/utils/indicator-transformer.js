import { INDICATOR_CONFIG } from "../config.js";

/**
 * Transform database indicator records to frontend format
 * @param {Array} dbIndicators - Technical analysis records from database
 * @returns {Object} Indicators formatted for frontend consumption
 */
export function transformIndicators(dbIndicators) {
  const indicators = {};

  for (const [category, types] of Object.entries(INDICATOR_CONFIG)) {
    for (const [type, periods] of Object.entries(types)) {
      for (const period of periods) {
        const key = `${type}${period}`;

        indicators[key] = dbIndicators
          .filter(
            (ta) => ta.indicators?.[category]?.[type]?.[String(period)] != null
          )
          .map((ta) => ({
            time: new Date(ta.timestamp).getTime() / 1000,
            value: ta.indicators[category][type][String(period)],
          }));
      }
    }
  }

  return indicators;
}
