import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import {
  Box,
  Button,
  Heading,
  Field,
  Input,
  HStack,
  Text,
  VStack,
  Badge,
  Container,
  AbsoluteCenter,
} from "@chakra-ui/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

function App() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [bars, setBars] = useState([]);
  const [ticker, setTicker] = useState("");
  const socketRef = useRef(null);
  const maxDataPoints = 50;

  useEffect(() => {
    // Connect to WebSocket server
    socketRef.current = io("http://localhost:3000");

    socketRef.current.on("connect", () => {
      console.log("Connected to server");
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socketRef.current.on("streamStatus", (data) => {
      setIsStreaming(data.isStreaming);
    });

    socketRef.current.on("bar", (bar) => {
      console.log("Received bar:", bar);
      setBars((prev) => {
        const newBars = [
          ...prev,
          {
            ...bar,
            time: new Date(bar.timestamp).toLocaleTimeString(),
            price: bar.closePrice, // Recharts prefers simple property names
          },
        ].slice(-maxDataPoints);
        return newBars;
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const startStream = (tickerSymbol) => {
    const symbol = tickerSymbol || ticker;
    if (socketRef.current && symbol) {
      socketRef.current.emit("startStream", { ticker: symbol.toUpperCase() });
    }
  };

  const stopStream = () => {
    if (socketRef.current) {
      socketRef.current.emit("stopStream");
    }
  };

  const clearData = () => {
    setBars([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    stopStream();
    startStream(ticker);
    setTicker(""); // Clear the input field after submitting
  };

  // Custom pulsing dot component
  const PulsingDot = ({ cx, cy }) => (
    <g>
      {/* Outer pulsing circle */}
      <circle cx={cx} cy={cy} r={8} fill="teal" opacity={0.3}>
        <animate
          attributeName="r"
          values="5;15"
          dur="1s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.5;0.1"
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
      {/* Inner solid dot */}
      <circle cx={cx} cy={cy} r={4} fill="teal" />
    </g>
  );

  // Custom dot component that only shows for the last point
  const LastPointDot = (props) => {
    const { payload, index } = props;
    const isLastPoint = index === bars.length - 1;

    if (isLastPoint) {
      return <PulsingDot {...props} />;
    }
    return null;
  };

  // Data is already in the right format for Recharts

  return (
    <Container maxW="100vw" p={4} className="app-container">
      <HStack spacing={4} align="stretch" h="600px">
        {/* Stock Info Sidebar */}
        <Box
          className="stock-info-box"
          w="300px"
          h="600px"
          p={4}
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          shadow="md"
          flexShrink={0}
        >
          <VStack spacing={4} align="start" h="100%">
            <form onSubmit={handleSubmit}>
              <Field.Root>
                <Field.Label>Ticker</Field.Label>
                <Input
                  placeholder="AAPL,TSLA etc"
                  color="gray.800"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                />
              </Field.Root>
            </form>
            <Text
              fontSize="lg"
              fontWeight="bold"
              color="gray.800"
              _hover={{ bg: "gray.100" }}
            >
              {bars[bars.length - 1]?.symbol}
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="teal.600">
              ${bars[bars.length - 1]?.closePrice}
            </Text>
            <Button
              onClick={stopStream}
              colorPalette="gray.800"
              variant="outline"
              w="100%"
            >
              Stop Stream
            </Button>
            <Button
              onClick={clearData}
              colorPalette="gray.800"
              variant="outline"
              w="100%"
            >
              Clear Data
            </Button>
          </VStack>
        </Box>

        {/* Chart Container */}
        <Box
          className="chart-box"
          flex="1"
          h="600px"
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          shadow="md"
          p={4}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={bars}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <XAxis dataKey="time" hide={true} />
              <YAxis hide={true} domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip
                labelFormatter={(label) => `Time: ${label}`}
                formatter={(value) => [`$${value}`, "Price"]}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="teal"
                strokeWidth={3}
                dot={LastPointDot}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </HStack>
    </Container>
  );
}

export default App;
