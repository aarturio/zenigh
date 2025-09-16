import { Box, Field, Input, VStack } from "@chakra-ui/react";

const Sidebar = ({ ticker, setTicker, onSubmit }) => {
  return (
    <Box className="card" w="300px" h="600px" p={4} flexShrink={0}>
      <VStack spacing={4} align="start" h="100%">
        <form onSubmit={onSubmit} style={{ width: "100%" }}>
          <Field.Root>
            <Field.Label>Ticker</Field.Label>
            <Input
              placeholder="AAPL,TSLA etc"
              className="card"
              color="gray.800"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              w="100%"
            />
          </Field.Root>
        </form>
      </VStack>
    </Box>
  );
};

export default Sidebar;
