import { Box, Field, Input, VStack } from "@chakra-ui/react";
import SearchBar from "./SearchBar";
import IndicatorTogglePanel from "./IndicatorTogglePanel";

const Sidebar = ({
  ticker,
  setTicker,
  onSubmit,
  enabledIndicators,
  onIndicatorToggle,
}) => {
  return (
    <Box className="card" w="300px" p={4} flexShrink={0} h="100%" bg="var(--color-bg)">
      <VStack spacing={4} align="stretch" h="100%">
        <SearchBar ticker={ticker} setTicker={setTicker} onSubmit={onSubmit} />
        <IndicatorTogglePanel
          enabledIndicators={enabledIndicators}
          onToggle={onIndicatorToggle}
        />
      </VStack>
    </Box>
  );
};

export default Sidebar;
