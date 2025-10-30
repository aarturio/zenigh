import { useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Button,
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogBody,
  DialogCloseTrigger,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import LoginForm from "../auth/LoginForm";
import SignUpForm from "../auth/SignUpForm";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const LandingPage = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  return (
    <Box minH="100vh" bg="var(--color-bg)" position="relative">
      {/* Top Navigation */}
      <Box position="absolute" top={0} right={0} p={6} zIndex={10}>
        <HStack spacing={3}>
          <Button
            size="sm"
            className="btn-fill-left-to-right"
            fontSize="sm"
            fontWeight="500"
            letterSpacing="wide"
            h="30px"
            w="90px"
            borderRadius="24px"
            onClick={() => setIsLoginOpen(true)}
          >
            Login
          </Button>

          <Button
            size="sm"
            className="btn-fill-left-to-right"
            fontSize="sm"
            fontWeight="500"
            letterSpacing="wide"
            h="30px"
            w="90px"
            borderRadius="24px"
            onClick={() => setIsSignUpOpen(true)}
          >
            Sign Up
          </Button>
        </HStack>
      </Box>

      {/* Login Dialog */}
      <DialogRoot
        open={isLoginOpen}
        onOpenChange={(e) => setIsLoginOpen(e.open)}
        preventScroll={false}
      >
        <DialogBackdrop bg="var(--color-overlay)" backdropFilter="blur(5px)" />
        <DialogContent
          bg="var(--color-bg)"
          borderColor="var(--color-primary-20)"
          borderWidth={1}
          position="fixed"
          top="60px"
          right="24px"
          maxW="400px"
        >
          <DialogCloseTrigger
            color="var(--color-text-60)"
            _hover={{ color: "var(--color-text)" }}
          />
          <DialogBody className="auth-dialog-body">
            <LoginForm />
          </DialogBody>
        </DialogContent>
      </DialogRoot>

      {/* Sign Up Dialog */}
      <DialogRoot
        open={isSignUpOpen}
        onOpenChange={(e) => setIsSignUpOpen(e.open)}
        preventScroll={false}
      >
        <DialogBackdrop bg="var(--color-overlay)" backdropFilter="blur(5px)" />
        <DialogContent
          bg="var(--color-bg)"
          borderColor="var(--color-primary-20)"
          borderWidth={1}
          position="fixed"
          top="60px"
          right="24px"
          maxW="400px"
        >
          <DialogCloseTrigger
            color="var(--color-text-60)"
            _hover={{ color: "var(--color-text)" }}
          />
          <DialogBody className="auth-dialog-body">
            <SignUpForm />
          </DialogBody>
        </DialogContent>
      </DialogRoot>

      {/* Centered Brand Name */}
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={4} textAlign="center" px={6}>
          <Heading
            fontSize={{ base: "5xl", md: "7xl" }}
            fontWeight="300"
            color="var(--color-text)"
            letterSpacing="tight"
            lineHeight="1.2"
            animation={`${fadeIn} 1s ease-out 0.2s forwards`}
            opacity={0}
          >
            zenigh
          </Heading>
        </VStack>
      </Box>
    </Box>
  );
};

export default LandingPage;
