import { useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Button,
  Input,
  Text,
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogBody,
  DialogCloseTrigger,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import LoginForm from "./LoginForm";

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
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleMailingList = (e) => {
    e.preventDefault();
    // TODO: Add mailing list API integration
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail("");
    }, 3000);
  };

  return (
    <Box minH="100vh" bg="var(--color-bg)" position="relative">
      {/* Top Navigation */}
      <Box position="absolute" top={0} right={0} p={6} zIndex={10}>
        <HStack spacing={3}>
          <Button
            size="sm"
            bg="var(--color-primary)"
            color="var(--color-bg)"
            _hover={{ bg: "var(--color-primary-dark)" }}
            transition="all 0.2s"
            fontSize="sm"
            fontWeight="500"
            letterSpacing="wide"
            h="30px"
            borderRadius="24px"
            px={6}
            onClick={() => setIsLoginOpen(true)}
          >
            Login
          </Button>

          <Button
            size="sm"
            bg="transparent"
            color="var(--color-primary)"
            border="1px solid var(--color-primary)"
            _hover={{ bg: "var(--color-primary-10)" }}
            transition="all 0.2s"
            fontSize="sm"
            fontWeight="500"
            letterSpacing="wide"
            h="30px"
            borderRadius="24px"
            px={6}
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
          <DialogBody pb={6}>
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
          <DialogBody pb={6} pt={8}>
            <VStack spacing={6} textAlign="center">
              <Heading
                color="var(--color-text)"
                fontWeight="300"
                fontSize="2xl"
              >
                Sign Ups Coming Soon
              </Heading>

              <Text className="text-secondary" fontSize="md">
                We're not accepting new sign ups at the moment. Join our mailing
                list to be notified when we launch!
              </Text>

              {!submitted ? (
                <form onSubmit={handleMailingList} style={{ width: "100%" }}>
                  <VStack spacing={4} w="full">
                    <Input
                      type="email"
                      className="input-teal"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                    <Button
                      type="submit"
                      size="lg"
                      width="full"
                      bg="var(--color-primary)"
                      color="var(--color-bg)"
                      _hover={{ bg: "var(--color-primary-dark)" }}
                      transition="all 0.2s"
                      h="48px"
                      borderRadius="24px"
                      fontWeight="500"
                    >
                      Join Mailing List
                    </Button>
                  </VStack>
                </form>
              ) : (
                <Box className="success-box" width="full">
                  <Text fontWeight="500">
                    Thanks for joining! We'll be in touch soon.
                  </Text>
                </Box>
              )}
            </VStack>
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
