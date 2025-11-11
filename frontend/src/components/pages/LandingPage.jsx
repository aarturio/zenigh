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
import LoginForm from "../auth/LoginForm";
import SignUpForm from "../auth/SignUpForm";
import { styles, fadeIn } from "./LandingPage.styles";

const LandingPage = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  return (
    <Box minH="100vh" bg="var(--color-bg)" position="relative">
      {/* Responsive Navigation - Top-right on desktop, bottom-center on mobile */}
      <Box {...styles.buttonContainer}>
        <HStack spacing={3}>
          <Button
            {...styles.authButton}
            className="btn-outline-teal"
            onClick={() => setIsLoginOpen(true)}
          >
            Login
          </Button>

          <Button
            {...styles.authButton}
            className="btn-outline-teal"
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
        <DialogBackdrop {...styles.dialogBackdrop} />
        <DialogContent {...styles.dialogContent}>
          <DialogCloseTrigger {...styles.dialogCloseTrigger} />
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
        <DialogBackdrop {...styles.dialogBackdrop} />
        <DialogContent {...styles.dialogContent}>
          <DialogCloseTrigger {...styles.dialogCloseTrigger} />
          <DialogBody className="auth-dialog-body">
            <SignUpForm />
          </DialogBody>
        </DialogContent>
      </DialogRoot>

      {/* Centered Brand Name */}
      <Box {...styles.brandContainer}>
        <VStack spacing={4} textAlign="center" px={6}>
          <Heading
            {...styles.brandHeading}
            animation={`${fadeIn} 1s ease-out 0.2s forwards`}
          >
            zenigh
          </Heading>
        </VStack>
      </Box>
    </Box>
  );
};

export default LandingPage;
