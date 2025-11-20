import { useState } from "react";
import { Box, Button, Input, Text, VStack } from "@chakra-ui/react";
import { authClient } from "../../../lib/auth-client";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await authClient.signIn.email({
      email,
      password,
    });

    if (authError) {
      setError(authError.message || "Login failed");
      setLoading(false);
    } else {
      navigate("/chart");
    }
  };

  return (
    <VStack gap={8} textAlign="center" w="full">
      {error && (
        <Box
          bg="error.10"
          color="error.solid"
          border="1px solid"
          borderColor="error.30"
          borderRadius="md"
          p={3}
          width="full"
        >
          {error}
        </Box>
      )}

      <Text fontSize="lg" fontWeight="300" color="fg">
        User Login
      </Text>

      <Box as="form" onSubmit={handleSubmit} w="full">
        <VStack gap={4} w="full">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            bg="bg.primary"
            color="fg"
            border="1px solid"
            borderColor="border.primary"
            borderRadius="md"
            _hover={{ borderColor: "border.hover" }}
            _focus={{
              borderColor: "border.hover",
              boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
              outline: "none",
            }}
            _placeholder={{ color: "fg.muted" }}
          />

          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            bg="bg.primary"
            color="fg"
            border="1px solid"
            borderColor="border.primary"
            borderRadius="md"
            _hover={{ borderColor: "border.hover" }}
            _focus={{
              borderColor: "border.hover",
              boxShadow: "0 0 0 1px var(--chakra-colors-primary)",
              outline: "none",
            }}
            _placeholder={{ color: "fg.muted" }}
          />

          <Button
            type="submit"
            size="sm"
            isLoading={loading}
            loadingText="Signing in..."
            bg="primary"
            color="bg.primary"
            _hover={{ bg: "primary.hover" }}
            transition="all 0.2s"
            h="30px"
            w="90px"
            borderRadius="24px"
            fontWeight="500"
            mt={4}
            alignSelf="center"
          >
            Login
          </Button>
        </VStack>
      </Box>
    </VStack>
  );
};

export default LoginForm;
