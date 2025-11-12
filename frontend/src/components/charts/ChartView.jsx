import { Box, HStack, Container, VStack } from "@chakra-ui/react";
import LightweightChart from "../charts/LightweightChart.jsx";
import PriceCard from "../charts/PriceCard.jsx";
import TimeframeButtons from "../charts/TimeframeButtons.jsx";
import { styles } from "./ChartView.styles";
import AIOutput from "../ai/AIOutput.jsx";

function ChartView({
  bars,
  indicators,
  hoveredPrice,
  setHoveredPrice,
  aiOutput,
  handleTimeframeChange,
  ticker,
}) {
  return (
    <Container {...styles.container}>
      <VStack {...styles.mainLayout}>
        {/* Main Chart Area */}
        {/* Price Chart Container */}
        <Box {...styles.priceChartContainer}>
          <Box {...styles.priceCardWrapper}>
            <PriceCard bars={bars} hoveredPrice={hoveredPrice} ticker={ticker} />
          </Box>
          <Box {...styles.chartWrapper}>
            <LightweightChart
              bars={bars}
              indicators={indicators}
              onHover={setHoveredPrice}
            />
          </Box>
          <Box {...styles.timeframeButtonContainer}>
            <TimeframeButtons onTimeframeChange={handleTimeframeChange} />
          </Box>
        </Box>
        {/* AI Output Section */}
        <Box h="200px">
          <AIOutput output={aiOutput} />
        </Box>
      </VStack>
    </Container>
  );
}

export default ChartView;
