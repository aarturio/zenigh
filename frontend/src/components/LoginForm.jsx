import { useState } from "react";
import { Box, Button, Input, VStack } from "@chakra-ui/react";
import { useAuth } from "../contexts/AuthContext";

const LoginForm = () => {
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
    <Box>
      <VStack spacing={5}>
        {error && (
          <Box className="error-box" width="full">
            {error}
          </Box>
        )}

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <VStack spacing={4}>
            <Box width="full">
              <Input
                type="email"
                className="input-teal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
              />
            </Box>

            <Box width="full">
              <Input
                type="password"
                className="input-teal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
            </Box>

            <Button
              type="submit"
              size="lg"
              width="full"
              isLoading={loading}
              loadingText="Signing in..."
              bg="var(--color-primary)"
              color="var(--color-bg)"
              _hover={{ bg: "var(--color-primary-dark)" }}
              transition="all 0.2s"
              h="48px"
              borderRadius="24px"
              fontWeight="500"
              mt={4}
            >
              Login
            </Button>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
};

export default LoginForm;
