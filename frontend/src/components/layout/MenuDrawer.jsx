import {
  Box,
  Button,
  VStack,
  Drawer,
  Portal,
  CloseButton,
} from "@chakra-ui/react";
import { authClient } from "../../../lib/auth-client";

const MenuDrawer = ({ open, onClose }) => {
  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/"; // redirect to login page
        },
      },
    });
  };
  return (
    <Box>
      {/* Drawer */}
      <Drawer.Root open={open} onOpenChange={onClose} placement="start">
        <Portal>
          <Drawer.Backdrop bg="var(--color-overlay)" />
          <Drawer.Positioner>
            <Drawer.Content
              bg="var(--color-primary-5)"
              borderRight="1px"
              borderColor="var(--color-primary-20)"
              color="var(--color-text)"
            >
              <Drawer.Body pt={20}>
                <VStack align="stretch" spacing={4}>
                  <Button
                    className="btn-outline-teal"
                    size="sm"
                    fontSize="sm"
                    fontWeight="500"
                    letterSpacing="wide"
                    borderRadius="24px"
                    w="full"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                  {/* Add more menu items */}
                </VStack>
              </Drawer.Body>

              <Drawer.CloseTrigger asChild>
                <CloseButton
                  size="sm"
                  color="var(--color-text-60)"
                  _hover={{
                    color: "var(--color-text)",
                    bg: "var(--color-primary-20)", // Subtle teal background like timeframe buttons
                  }}
                />
              </Drawer.CloseTrigger>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </Box>
  );
};

export default MenuDrawer;
