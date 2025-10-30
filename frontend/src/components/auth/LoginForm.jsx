import { useState } from "react";
import { Box, Button, Input, Text } from "@chakra-ui/react";
import { useAuth } from "../../contexts/AuthContext";

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
    <div className="auth-dialog-content" style={{ textAlign: "center" }}>
      {error && (
        <Box className="error-box" width="full">
          {error}
        </Box>
      )}

      <Text fontSize="lg" fontWeight="300" color="var(--color-text)">
        User Login
      </Text>

      <form onSubmit={handleSubmit} style={{ width: "100%" }}>
        <div className="auth-form-fields">
          <Input
            type="email"
            className="input-teal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />

          <Input
            type="password"
            className="input-teal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />

          <Button
            type="submit"
            size="sm"
            isLoading={loading}
            loadingText="Signing in..."
            bg="var(--color-primary)"
            color="var(--color-bg)"
            _hover={{ bg: "var(--color-primary-dark)" }}
            transition="all 0.2s"
            h="30px"
            w="90px"
            borderRadius="24px"
            fontWeight="500"
            className="auth-submit-button"
          >
            Login
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
