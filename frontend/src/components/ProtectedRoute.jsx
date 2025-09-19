import { useAuth } from '../contexts/AuthContext';
import { Box, Spinner, Center } from '@chakra-ui/react';
import AuthPage from './AuthPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Center minH="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return children;
};

export default ProtectedRoute;