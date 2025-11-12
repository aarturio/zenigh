import { Box, Text, FormatNumber } from "@chakra-ui/react";

const PriceCard = (props) => {
  const { bars, hoveredPrice, ticker } = props;

  if (!bars || bars.length === 0) {
    return null;
  }

  // Use hovered price if available, otherwise use latest bar value
  const displayPrice = hoveredPrice ?? bars[bars.length - 1]?.value;

  return (
    <Box p={2} textAlign="center">
      <Text textStyle="lg" fontWeight="bold" color="var(--color-text)">
        {ticker}
      </Text>
      <Text textStyle="lg" fontWeight="bold" color="var(--color-primary)">
        <FormatNumber
          value={displayPrice}
          style="currency"
          currency="USD"
        />
      </Text>
    </Box>
  );
};

export default PriceCard;
