import { Box, VStack, HStack, Heading, Button } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate("/auth");
  };

  const handleSignUp = () => {
    navigate("/auth");
  };

  return (
    <Box
      minH="100vh"
      bg="#000000"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack spacing={32} textAlign="center" px={6}>
        {/* Brand Name */}
        <VStack spacing={4} mb={8}>
          <Heading
            fontSize={{ base: "5xl", md: "7xl" }}
            fontWeight="300"
            color="white"
            letterSpacing="tight"
            lineHeight="1.2"
            animation={`${fadeIn} 1s ease-out 0.2s forwards`}
            opacity={0}
          >
            zenigh
          </Heading>
        </VStack>

        {/* Auth Buttons */}
        <HStack spacing={4} w={{ base: "full", sm: "auto" }} mt={8}>
          <Button
            size="lg"
            bg="#14b8a6"
            color="#000000"
            _hover={{ bg: "#0d9488" }}
            transition="all 0.2s"
            onClick={handleSignIn}
            fontSize="md"
            fontWeight="500"
            letterSpacing="wide"
            h="56px"
            borderRadius="12px"
            px={8}
          >
            Sign In
          </Button>
          <Button
            size="lg"
            bg="transparent"
            color="#14b8a6"
            border="1px solid #14b8a6"
            _hover={{ bg: "rgba(20, 184, 166, 0.1)" }}
            transition="all 0.2s"
            onClick={handleSignUp}
            fontSize="md"
            fontWeight="500"
            letterSpacing="wide"
            h="56px"
            borderRadius="12px"
            px={8}
          >
            Sign Up
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default LandingPage;
