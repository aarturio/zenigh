import { Box, Text, FormatNumber } from "@chakra-ui/react";

const PriceCard = (props) => {
  const { bars, hoveredPrice } = props;

  if (!bars || bars.length === 0) {
    return null;
  }

  return (
    <Box p={2}>
      <Text textStyle="lg" fontWeight="bold" color="gray.800">
        {bars[bars.length - 1]?.symbol}
      </Text>
      <Text textStyle="lg" fontWeight="bold" color="teal">
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
