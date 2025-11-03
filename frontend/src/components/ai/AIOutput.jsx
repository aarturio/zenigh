import { Box, Text } from "@chakra-ui/react";

const AIOutput = ({ output }) => {
  return (
    <Box
      className="card"
      flex="1"
      h="100%"
      p={4}
      display="flex"
      flexDirection="column"
    >
      <Box fontSize="sm" fontWeight="bold" mb={2} color="var(--color-text)">
        AI Analysis
      </Box>
      <Box
        flex="1"
        overflowY="auto"
        color="var(--color-text)"
        fontSize="sm"
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'var(--color-bg)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'var(--color-primary-30)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'var(--color-primary)',
          },
        }}
      >
        {output ? (
          <Text whiteSpace="pre-wrap">{output}</Text>
        ) : (
          <Text color="var(--color-text-50)">
            AI analysis will appear here when data is available...
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default AIOutput;
