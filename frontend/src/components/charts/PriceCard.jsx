import { Box, Text, FormatNumber } from "@chakra-ui/react";

const PriceCard = (props) => {
  const { bars, hoveredPrice } = props;

  if (!bars || bars.length === 0) {
    return null;
  }

  return (
    <Box p={2} textAlign="center">
      <Text textStyle="lg" fontWeight="bold" color="var(--color-text)">
        {bars[bars.length - 1]?.symbol}
      </Text>
      <Text textStyle="lg" fontWeight="bold" color="var(--color-primary)">
        <FormatNumber
          value={
            hoveredPrice !== null
              ? hoveredPrice
              : bars[bars.length - 1]?.closePrice
          }
          style="currency"
          currency="USD"
        />
      </Text>
    </Box>
  );
};

export default PriceCard;
