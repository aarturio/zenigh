import { INDICATOR_CONFIG } from "../config.js";

/**
 * Transform database indicator records to frontend format
 * @param {Array} dbIndicators - Technical analysis records from database
 * @returns {Object} Indicators formatted for frontend consumption
 */
export function transformIndicators(dbIndicators) {
  const indicators = {};

  for (const [category, types] of Object.entries(INDICATOR_CONFIG)) {
    for (const [type, params] of Object.entries(types)) {
      for (const param of params) {
        const paramKey = String(param);

        // Get the indicator data for this param
        const indicatorData = dbIndicators
          .filter((ta) => ta.indicators?.[category]?.[type]?.[paramKey] != null)
          .map((ta) => {
            const data = ta.indicators[category][type][paramKey];
            return {
              timestamp: ta.timestamp,
              data: data,
            };
          });

        // Check if this is a multi-value indicator (object) or single-value (number)
        if (indicatorData.length > 0 && typeof indicatorData[0].data === 'object') {
          // Multi-value indicator - create separate series for each property
          const firstData = indicatorData[0].data;
          for (const prop of Object.keys(firstData)) {
            const key = `${type}${param}_${prop}`;
            indicators[key] = indicatorData.map((item) => ({
              time: new Date(item.timestamp).getTime() / 1000,
              value: item.data[prop],
            }));
          }
        } else {
          // Single-value indicator
          const key = `${type}${param}`;
          indicators[key] = indicatorData.map((item) => ({
            time: new Date(item.timestamp).getTime() / 1000,
            value: item.data,
          }));
        }
      }
    }
  }

  return indicators;
}
