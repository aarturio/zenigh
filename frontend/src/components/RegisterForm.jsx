import { useState } from "react";
import {
  Box,
  Button,
  Input,
  VStack,
  Text,
  Heading,
  Link,
  HStack,
} from "@chakra-ui/react";
import { useAuth } from "../contexts/AuthContext";

const RegisterForm = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    const result = await register(
      formData.email,
      formData.password,
      formData.firstName,
      formData.lastName
    );

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
        <Heading size="lg">Create Account</Heading>

        {error && (
          <Box bg="red.100" color="red.800" p={3} borderRadius="md" width="full">
            {error}
          </Box>
        )}

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <VStack spacing={4}>
            <HStack spacing={4} width="full">
              <Box width="full">
                <Text mb={2}>First Name</Text>
                <Input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                />
              </Box>

              <Box width="full">
                <Text mb={2}>Last Name</Text>
                <Input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                />
              </Box>
            </HStack>

            <Box width="full">
              <Text mb={2}>Email</Text>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </Box>

            <Box width="full">
              <Text mb={2}>Password</Text>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password (min 8 characters)"
                required
              />
            </Box>

            <Box width="full">
              <Text mb={2}>Confirm Password</Text>
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </Box>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              width="full"
              isLoading={loading}
              loadingText="Creating account..."
            >
              Create Account
            </Button>
          </VStack>
        </form>

        <Text>
          Already have an account?{" "}
          <Link color="blue.500" onClick={onSwitchToLogin} cursor="pointer">
            Sign in here
          </Link>
        </Text>
      </VStack>
    </Box>
  );
};

export default RegisterForm;
