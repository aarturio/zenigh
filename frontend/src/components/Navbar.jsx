import { Box, Flex, Text, Button, HStack } from "@chakra-ui/react";
import { useAuth } from "../contexts/AuthContext";
import { User, LogOut } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <Box bg="white" borderBottom="1px" borderColor="gray.200" px={4} py={4}>
      <Flex justify="flex-start" align="center">
        <HStack spacing={4}>
          <User size={20} />
          <LogOut size={20} onClick={logout} style={{ cursor: "pointer" }} />
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navbar;
