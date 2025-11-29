import { useState } from "react";
import { Box } from "@chakra-ui/react";
import ChartView from "../charts/ChartView.jsx";
import { useMarketData } from "../../hooks/useMarketData.js";

function ChartPage() {
  const [bars, setBars] = useState([]);
  const [indicators, setIndicators] = useState({});
  const [activeTicker, setActiveTicker] = useState(null);
  const [hoveredPrice, setHoveredPrice] = useState(null);
  const [aiOutput] = useState(""); // TODO: Implement AI output feature
  const { fetchBars } = useMarketData();
  const [loading, setLoading] = useState(false);

  const loadChartData = async (symbol, timeframe) => {
    setLoading(true);
    try {
      const data = await fetchBars(symbol, timeframe);
      setBars(data.bars); // Use existing state
      setIndicators(data.indicators);
    } catch (error) {
      console.error("Failed to load chart data:", error);
      // TODO: Show error toast
    } finally {
      setLoading(false);
    }
  };

  const handleTimeframeChange = (e, timeframe) => {
    e.preventDefault();
    if (activeTicker) {
      loadChartData(activeTicker, timeframe);
    }
  };

  const handleSelectSymbol = (symbol) => {
    loadChartData(symbol, "1H");
    setActiveTicker(symbol);
  };

  return (
    <Box>
      <ChartView
        bars={bars}
        indicators={indicators}
        hoveredPrice={hoveredPrice}
        setHoveredPrice={setHoveredPrice}
        aiOutput={aiOutput}
        handleTimeframeChange={handleTimeframeChange}
        ticker={activeTicker}
        onSelectSymbol={handleSelectSymbol}
        loading={loading}
      />
    </Box>
  );
}

export default ChartPage;
