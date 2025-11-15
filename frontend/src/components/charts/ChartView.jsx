import { useState } from "react";
import { Box, Container, VStack, HStack } from "@chakra-ui/react";
import LightweightChart from "../charts/LightweightChart.jsx";
import PriceCard from "../charts/PriceCard.jsx";
import TimeframeButtons from "../charts/TimeframeButtons.jsx";
import IndicatorControl from "../layout/IndicatorControl.jsx";
import AIOutput from "../ai/AIOutput.jsx";
import SymbolMenu from "../layout/SymbolMenu.jsx";

function ChartView({
  bars,
  indicators,
  hoveredPrice,
  setHoveredPrice,
  aiOutput,
  handleTimeframeChange,
  ticker,
  onSelectSymbol,
}) {
  const [selectedIndicators, setSelectedIndicators] = useState([]);

  const handleToggleIndicator = (indicator) => {
    setSelectedIndicators((prev) => {
      const isSelected = prev.some((ind) => ind.id === indicator.id);
      if (isSelected) {
        return prev.filter((ind) => ind.id !== indicator.id);
      } else {
        return [...prev, indicator];
      }
    });
  };

  const handleRemoveIndicator = (indicatorId) => {
    setSelectedIndicators((prev) =>
      prev.filter((ind) => ind.id !== indicatorId)
    );
  };

  const handleClearAll = () => {
    setSelectedIndicators([]);
  };

  const selectedIndicatorIds = selectedIndicators.map((ind) => ind.id);

  return (
    <Container maxW="100vw" p={2} bg="bg.primary">
      <VStack spacing={2} align="stretch" h="calc(100vh - 16px)">
        {/* Symbol Menu and Indicator Control */}
        <HStack align="start" gap={0} w="full">
          <SymbolMenu activeTicker={ticker} onSelectSymbol={onSelectSymbol} />
          <IndicatorControl
            selectedIndicators={selectedIndicators}
            onToggle={handleToggleIndicator}
            onRemove={handleRemoveIndicator}
            onClearAll={handleClearAll}
          />
        </HStack>

        {/* Main Chart Area */}
        {/* Price Chart Container */}
        <Box flex="1" p={3} display="flex" flexDirection="column" minH="0">
          <Box display="flex" justifyContent="center" alignItems="center">
            <PriceCard
              bars={bars}
              hoveredPrice={hoveredPrice}
              ticker={ticker}
            />
          </Box>
          <Box flex="1" minH="0" position="relative" mb={4} pb={4}>
            <LightweightChart
              bars={bars}
              indicators={indicators}
              selectedIndicators={selectedIndicatorIds}
              onHover={setHoveredPrice}
            />
          </Box>
          <Box display="flex" justifyContent="center" position="relative" zIndex={10}>
            <TimeframeButtons onTimeframeChange={handleTimeframeChange} />
          </Box>
        </Box>
        {/* AI Output Section */}
        <Box flex="0 0 200px" minH="0">
          <AIOutput output={aiOutput} />
        </Box>
      </VStack>
    </Container>
  );
}

export default ChartView;
