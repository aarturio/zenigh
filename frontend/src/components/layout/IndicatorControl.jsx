import {
  Box,
  HStack,
  Button,
  IconButton,
  Text,
  Menu,
  SimpleGrid,
  Portal,
} from "@chakra-ui/react";
import { ChartNoAxesCombined, X, Check } from "lucide-react";
import { INDICATOR_CATEGORIES } from "../../config";

const IndicatorControl = ({
  selectedIndicators,
  onToggle,
  onRemove,
  onClearAll,
}) => {
  const isChecked = (indicatorId) =>
    selectedIndicators.some((ind) => ind.id === indicatorId);

  // Flatten all indicators into a single array
  const allIndicators = Object.values(INDICATOR_CATEGORIES).flatMap(
    (category) => category.indicators
  );

  return (
    <HStack gap={2} flexWrap="wrap">
      {/* Menu */}
      <Menu.Root>
        <Menu.Trigger>
          <IconButton
            size="sm"
            variant="ghost"
            color="fg"
            display="flex"
            alignItems="center"
            justifyContent="center"
            _hover={{
              bg: "text.subtle",
            }}
          >
            <ChartNoAxesCombined size={16} />
          </IconButton>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content
              bg="bg.primary"
              borderColor="border.primary"
              maxW="450px"
              maxH="500px"
              overflowY="auto"
            >
              <Box p={3}>
                <SimpleGrid columns={3} gap={2}>
                  {allIndicators.map((indicator) => {
                    const checked = isChecked(indicator.id);
                    return (
                      <HStack
                        key={indicator.id}
                        onClick={() => onToggle(indicator)}
                        cursor="pointer"
                        px={2}
                        py={1}
                        rounded="sm"
                        color="fg"
                        _hover={{ bg: "teal.5" }}
                        transition="all 0.2s"
                      >
                        <Box
                          w="14px"
                          h="14px"
                          border="2px solid"
                          borderColor={checked ? "primary" : "border"}
                          bg={checked ? "primary" : "transparent"}
                          color="bg.primary"
                          rounded="sm"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                          transition="all 0.2s"
                        >
                          {checked && <Check size={10} strokeWidth={3} />}
                        </Box>
                        <Box
                          w="8px"
                          h="8px"
                          bg={indicator.color}
                          rounded="full"
                          flexShrink={0}
                        />
                        <Text fontSize="xs" flex={1}>
                          {indicator.label}
                        </Text>
                      </HStack>
                    );
                  })}
                </SimpleGrid>
              </Box>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>

      {/* Selected Indicator Tags */}
      {selectedIndicators.map((indicator) => (
        <Box
          key={indicator.id}
          display="inline-flex"
          alignItems="center"
          px={2}
          py={1}
          fontSize="xs"
          fontWeight="500"
          bg="teal.10"
          color="fg"
          rounded="full"
          border="1px solid"
          borderColor="border.primary"
        >
          <Box w="6px" h="6px" bg={indicator.color} rounded="full" mr={1.5} />
          <Text fontSize="xs">{indicator.label}</Text>
          <IconButton
            size="2xs"
            variant="ghost"
            onClick={() => onRemove(indicator.id)}
            ml={1}
            color="fg.tertiary"
            minW="auto"
            h="auto"
            _hover={{
              color: "fg",
              bg: "transparent",
            }}
          >
            <X size={10} />
          </IconButton>
        </Box>
      ))}

      {/* Clear All Button */}
      {selectedIndicators.length > 0 && (
        <Button
          onClick={onClearAll}
          size="sm"
          variant="ghost"
          color="fg.tertiary"
          fontSize="xs"
          _hover={{
            color: "fg",
            bg: "teal.10",
          }}
        >
          Clear
        </Button>
      )}
    </HStack>
  );
};

export default IndicatorControl;
export { INDICATOR_CATEGORIES };
