import { Box, Field, Input, VStack } from "@chakra-ui/react";
import SearchBar from "./SearchBar";

const Sidebar = ({ ticker, setTicker, onSubmit }) => {
  return (
    <Box className="card" w="300px" h="600px" p={4} flexShrink={0}>
      <VStack spacing={4} align="start" h="100%">
        <SearchBar ticker={ticker} setTicker={setTicker} onSubmit={onSubmit} />
      </VStack>
    </Box>
  );
};

export default Sidebar;
