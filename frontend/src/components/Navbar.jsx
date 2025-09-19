import { Box, Flex, Text, Button, HStack } from "@chakra-ui/react";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <Box bg="white" borderBottom="1px" borderColor="gray.200" px={4} py={3}>
      <Flex justify="space-between" align="center">
        <HStack spacing={4}>
          <Text>Welcome, {user?.firstName || user?.email}</Text>
          <Button size="sm" colorScheme="red" onClick={logout}>
            Sign Out
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navbar;
