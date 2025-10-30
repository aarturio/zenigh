import { useState } from "react";
import { Box, Button, Input, Text } from "@chakra-ui/react";

const SignUpForm = () => {
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
    <div className="auth-dialog-content" style={{ textAlign: "center" }}>
      <Text fontSize="lg" fontWeight="300" color="var(--color-text)">
        Sign Ups Coming Soon
      </Text>

      <Text className="text-secondary" fontSize="sm">
        We're not accepting new sign ups at the moment. Join our mailing
        list to be notified when we launch!
      </Text>

      {!submitted ? (
        <form onSubmit={handleMailingList} style={{ width: "100%" }}>
          <div className="auth-form-fields">
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
              size="sm"
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
              Join
            </Button>
          </div>
        </form>
      ) : (
        <Box className="success-box" width="full">
          <Text fontWeight="500">
            Thanks for joining! We'll be in touch soon.
          </Text>
        </Box>
      )}
    </div>
  );
};

export default SignUpForm;
