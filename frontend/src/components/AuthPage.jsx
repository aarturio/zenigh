import { Container, Box } from '@chakra-ui/react';
import LoginForm from './LoginForm';

const AuthPage = () => {
  return (
    <Container maxW="100vw" minH="100vh" bg="var(--color-bg)" py={8} display="flex" alignItems="center" justifyContent="center">
      <Box>
        <LoginForm />
      </Box>
    </Container>
  );
};

export default AuthPage;