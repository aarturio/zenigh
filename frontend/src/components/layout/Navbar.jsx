import { Box, Flex } from "@chakra-ui/react";
import SearchBar from "../ui/SearchBar";

const Navbar = ({ ticker, setTicker, onSubmit }) => {
  return (
    <Box
      borderBottom="1px"
      borderColor="var(--color-primary-20)"
      px={4}
      py={4}
      bg="var(--color-bg)"
    >
      <Flex justify="center" align="center">
        {ticker !== undefined && (
          <SearchBar
            ticker={ticker}
            setTicker={setTicker}
            onSubmit={onSubmit}
          />
        )}
      </Flex>
    </Box>
  );
};

export default Navbar;
