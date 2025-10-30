import { Box, Input } from "@chakra-ui/react";
import { Search } from "lucide-react";

const SearchBar = ({ ticker, setTicker, onSubmit }) => {
  return (
    <form onSubmit={onSubmit} style={{ width: "100%" }}>
      <Box position="relative" w="100%">
        <Input
          className="input-teal"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          w="100%"
          pl={10}
          placeholder="Search ticker..."
        />
        <Box
          position="absolute"
          left={3}
          top="50%"
          transform="translateY(-50%)"
          pointerEvents="none"
          className="text-tertiary"
        >
          <Search size={16} />
        </Box>
      </Box>
    </form>
  );
};

export default SearchBar;
