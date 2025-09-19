import { useState } from 'react';
import { Container, Box } from '@chakra-ui/react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  const switchToRegister = () => setIsLogin(false);
  const switchToLogin = () => setIsLogin(true);

  return (
    <Container maxW="100vw" minH="100vh" bg="gray.50" py={8}>
      <Box>
        {isLogin ? (
          <LoginForm onSwitchToRegister={switchToRegister} />
        ) : (
          <RegisterForm onSwitchToLogin={switchToLogin} />
        )}
      </Box>
    </Container>
  );
};

export default AuthPage;