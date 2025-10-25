import React from "react";
import { Box, VStack, HStack, Switch, Text } from "@chakra-ui/react";

/**
 * Panel for toggling technical indicators on/off
 */
const IndicatorTogglePanel = ({ enabledIndicators, onToggle }) => {
  const indicators = [
    {
      id: "sma20",
      label: "SMA 20",
      category: "Moving Averages",
      color: "#10b981",
    },
    { id: "sma50", label: "SMA 50", category: "Moving Averages", color: "#3b82f6" },
    {
      id: "sma200",
      label: "SMA 200",
      category: "Moving Averages",
      color: "#8b5cf6",
    },
    { id: "ema12", label: "EMA 12", category: "Moving Averages", color: "#f59e0b" },
    { id: "ema26", label: "EMA 26", category: "Moving Averages", color: "#ef4444" },
    { id: "macd", label: "MACD", category: "Oscillators", color: "#06b6d4" },
    { id: "rsi", label: "RSI", category: "Oscillators", color: "#ec4899" },
  ];

  const groupedIndicators = indicators.reduce((acc, indicator) => {
    if (!acc[indicator.category]) {
      acc[indicator.category] = [];
    }
    acc[indicator.category].push(indicator);
    return acc;
  }, {});

  return (
    <Box w="100%">
      <Text fontSize="md" fontWeight="bold" mb={3}>
        Indicators
      </Text>

      {Object.entries(groupedIndicators).map(([category, items], idx) => (
        <Box key={category} mb={idx < Object.keys(groupedIndicators).length - 1 ? 4 : 0}>
          <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>
            {category}
          </Text>
          <VStack align="stretch" spacing={2}>
            {items.map((indicator) => (
              <HStack key={indicator.id} justify="space-between">
                <HStack spacing={2}>
                  <Box
                    w="12px"
                    h="12px"
                    borderRadius="full"
                    bg={indicator.color}
                    opacity={enabledIndicators[indicator.id] ? 1 : 0.3}
                  />
                  <Text fontSize="sm">{indicator.label}</Text>
                </HStack>
                <Switch.Root
                  size="sm"
                  colorPalette="teal"
                  checked={enabledIndicators[indicator.id]}
                  onCheckedChange={() => onToggle(indicator.id)}
                >
                  <Switch.HiddenInput />
                  <Switch.Control />
                </Switch.Root>
              </HStack>
            ))}
          </VStack>
          {idx < Object.keys(groupedIndicators).length - 1 && (
            <Box h="1px" bg="gray.200" my={2} />
          )}
        </Box>
      ))}
    </Box>
  );
};

export default IndicatorTogglePanel;
