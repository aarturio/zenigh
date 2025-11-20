import { Box, Text } from "@chakra-ui/react";

const AIOutput = ({ output }) => {
  return (
    <Box flex="1" h="100%" p={3} display="flex" flexDirection="column">
      <Box fontSize="sm" fontWeight="bold" mb={2} color="fg">
        AI Analysis
      </Box>
      <Box
        flex="1"
        overflowY="auto"
        color="fg"
        fontSize="sm"
        css={{
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "var(--chakra-colors-bg-primary)",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "var(--chakra-colors-teal-30)",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "var(--chakra-colors-teal-solid)",
          },
        }}
      >
        {output ? (
          <Text whiteSpace="pre-wrap">{output}</Text>
        ) : (
          <Text color="fg.muted">
            AI analysis will appear here when data is available...
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default AIOutput;
