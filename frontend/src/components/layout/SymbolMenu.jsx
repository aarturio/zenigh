import { HStack, Text, Menu, Portal, IconButton } from "@chakra-ui/react";
import { Receipt } from "lucide-react";
import { SYMBOLS } from "../../config";

const SymbolMenu = ({ activeTicker, onSelectSymbol }) => {
  return (
    <HStack gap={2} flexWrap="wrap">
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
            <Receipt size={16} />
          </IconButton>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content
              bg="bg.primary"
              borderColor="border.primary"
              minW="120px"
            >
              {SYMBOLS.map((symbol) => {
                const isActive = activeTicker === symbol;
                return (
                  <Menu.Item
                    key={symbol}
                    value={symbol}
                    color={isActive ? "primary" : "fg"}
                    bg={isActive ? "teal.5" : "transparent"}
                    _hover={{ bg: "teal.10" }}
                    cursor="pointer"
                    onClick={() => onSelectSymbol(symbol)}
                  >
                    <Text fontSize="sm" fontWeight={isActive ? "600" : "400"}>
                      {symbol}
                    </Text>
                  </Menu.Item>
                );
              })}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </HStack>
  );
};

export default SymbolMenu;
