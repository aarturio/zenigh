import { Box, Flex, Text, Button, HStack } from "@chakra-ui/react";
import { useAuth } from "../contexts/AuthContext";
import { User, LogOut } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <Box borderBottom="1px" borderColor="var(--color-primary-20)" px={4} py={4} bg="var(--color-bg)">
      <Flex justify="flex-start" align="center">
        <HStack spacing={4}>
          <User size={20} color="var(--color-primary)" style={{ cursor: "pointer" }} />
          <LogOut size={20} color="var(--color-primary)" onClick={logout} style={{ cursor: "pointer" }} />
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navbar;
