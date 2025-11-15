import { useState } from "react";
import { Box, Button, Input, Text, VStack } from "@chakra-ui/react";

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
    <VStack gap={8} textAlign="center" w="full">
      <Text fontSize="lg" fontWeight="300" color="fg">
        Sign Ups Coming Soon
      </Text>

      <Text color="fg.secondary" fontSize="sm">
        We're not accepting new sign ups at the moment. Join our mailing
        list to be notified when we launch!
      </Text>

      {!submitted ? (
        <Box as="form" onSubmit={handleMailingList} w="full">
          <VStack gap={4} w="full">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
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
              Join
            </Button>
          </VStack>
        </Box>
      ) : (
        <Box
          bg="teal.10"
          color="primary"
          border="1px solid"
          borderColor="border.primary"
          borderRadius="md"
          p={4}
          width="full"
        >
          <Text fontWeight="500">
            Thanks for joining! We'll be in touch soon.
          </Text>
        </Box>
      )}
    </VStack>
  );
};

export default SignUpForm;
