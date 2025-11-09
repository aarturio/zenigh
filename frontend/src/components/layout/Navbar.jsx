import { Box, Flex, HStack, useDisclosure } from "@chakra-ui/react";
import { Menu } from "lucide-react";
import SearchBar from "../ui/SearchBar";
import MenuDrawer from "./MenuDrawer";

const Navbar = ({ ticker, setTicker, onSubmit }) => {
  const { open, onOpen, onClose } = useDisclosure();

  return (
    <Box
      borderBottom="1px"
      borderColor="var(--color-primary-20)"
      px={4}
      py={4}
      bg="var(--color-bg)"
    >
      <Flex justify="space-between" align="center">
        <HStack spacing={4}>
          <Box
            as="button"
            onClick={onOpen}
            cursor="pointer"
            transition="transform 0.3s ease"
            transform={open ? "rotate(180deg)" : "rotate(0deg)"}
          >
            <Menu size={20} color="var(--color-primary)" />
          </Box>
        </HStack>

        {ticker !== undefined && (
          <SearchBar
            ticker={ticker}
            setTicker={setTicker}
            onSubmit={onSubmit}
          />
        )}
      </Flex>
      <MenuDrawer open={open} onClose={onClose} />
    </Box>
  );
};

export default Navbar;
