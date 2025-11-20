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
    <Box minH="100vh" bg="bg.primary" position="relative">
      {/* Responsive Navigation - Top-right on desktop, bottom-center on mobile */}
      <Box
        position="fixed"
        top={{ base: "auto", md: 0 }}
        bottom={{ base: 4, md: "auto" }}
        right={{ base: "50%", md: 0 }}
        transform={{ base: "translateX(50%)", md: "none" }}
        p={{ base: 4, md: 6 }}
        zIndex={10}
      >
        <HStack spacing={3}>
          <Button
            size="sm"
            fontSize="sm"
            fontWeight="500"
            letterSpacing="wide"
            h={{ base: "44px", md: "30px" }}
            minW={{ base: "120px", md: "90px" }}
            borderRadius="24px"
            bg="transparent"
            color="primary"
            borderWidth="1px"
            borderColor="primary"
            transition="all 0.3s ease"
            _hover={{ bg: "primary", color: "bg.primary" }}
            onClick={() => setIsLoginOpen(true)}
          >
            Login
          </Button>

          <Button
            size="sm"
            fontSize="sm"
            fontWeight="500"
            letterSpacing="wide"
            h={{ base: "44px", md: "30px" }}
            minW={{ base: "120px", md: "90px" }}
            borderRadius="24px"
            bg="transparent"
            color="primary"
            borderWidth="1px"
            borderColor="primary"
            transition="all 0.3s ease"
            _hover={{ bg: "primary", color: "bg.primary" }}
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
        <DialogBackdrop bg="bg.overlay" backdropFilter="blur(5px)" />
        <DialogContent
          bg="bg.primary"
          borderColor="border.primary"
          borderWidth={1}
          position="fixed"
          top={{ base: "50%", md: "60px" }}
          right={{ base: "50%", md: "24px" }}
          left={{ base: "50%", md: "auto" }}
          transform={{ base: "translate(-50%, -50%)", md: "none" }}
          maxW={{ base: "90%", sm: "400px", md: "400px" }}
          mx={{ base: "auto", md: 0 }}
        >
          <DialogCloseTrigger
            color="fg.tertiary"
            _hover={{ color: "fg" }}
          />
          <DialogBody p={6}>
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
        <DialogBackdrop bg="bg.overlay" backdropFilter="blur(5px)" />
        <DialogContent
          bg="bg.primary"
          borderColor="border.primary"
          borderWidth={1}
          position="fixed"
          top={{ base: "50%", md: "60px" }}
          right={{ base: "50%", md: "24px" }}
          left={{ base: "50%", md: "auto" }}
          transform={{ base: "translate(-50%, -50%)", md: "none" }}
          maxW={{ base: "90%", sm: "400px", md: "400px" }}
          mx={{ base: "auto", md: 0 }}
        >
          <DialogCloseTrigger
            color="fg.tertiary"
            _hover={{ color: "fg" }}
          />
          <DialogBody p={6}>
            <SignUpForm />
          </DialogBody>
        </DialogContent>
      </DialogRoot>

      {/* Centered Brand Name */}
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4} textAlign="center" px={6}>
          <Heading
            fontSize={{ base: "5xl", md: "7xl" }}
            fontWeight="300"
            color="fg"
            letterSpacing="tight"
            lineHeight="1.2"
            opacity={0}
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
