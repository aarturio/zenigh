export const useMarketData = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const fetchBars = async (symbol, timeframe) => {
    const response = await fetch(
      `${BACKEND_URL}/market-data/${symbol}/${timeframe}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  };

  return { fetchBars };
};
