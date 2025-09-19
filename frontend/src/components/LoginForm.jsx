import { useState } from "react";
import {
  Box,
  Button,
  Input,
  VStack,
  Text,
  Heading,
  Link,
} from "@chakra-ui/react";
import { useAuth } from "../contexts/AuthContext";

const LoginForm = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(email, password);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <Box
      maxW="md"
      mx="auto"
      mt={8}
      p={6}
      borderWidth={1}
      borderRadius="lg"
      boxShadow="lg"
    >
      <VStack spacing={4}>
        <Heading size="lg">Sign In</Heading>

        {error && (
          <Box bg="red.100" color="red.800" p={3} borderRadius="md" width="full">
            {error}
          </Box>
        )}

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <VStack spacing={4}>
            <Box width="full">
              <Text mb={2}>Email</Text>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </Box>

            <Box width="full">
              <Text mb={2}>Password</Text>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </Box>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              width="full"
              isLoading={loading}
              loadingText="Signing in..."
            >
              Sign In
            </Button>
          </VStack>
        </form>

        <Text>
          Don't have an account?{" "}
          <Link color="blue.500" onClick={onSwitchToRegister} cursor="pointer">
            Sign up here
          </Link>
        </Text>
      </VStack>
    </Box>
  );
};

export default LoginForm;
