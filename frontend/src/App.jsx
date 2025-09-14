import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import {
  Box,
  Button,
  ButtonGroup,
  Field,
  Input,
  HStack,
  Text,
  VStack,
  Container,
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
import LastPointDot from "./components/PulsingDot.jsx";

function App() {
  const [bars, setBars] = useState([]);
  const [ticker, setTicker] = useState("");
  const [activeTicker, setActiveTicker] = useState(null);
  const socketRef = useRef(null);
  const maxDataPoints = 200;

  useEffect(() => {
    // Connect to WebSocket server
    socketRef.current = io("http://localhost:3000");

    socketRef.current.on("connect", () => {
      console.log("Connected to server");
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socketRef.current.on("historicalData", (data) => {
      // Transform the data to match your chart format
      const transformedData = data.map((bar, index) => ({
        time: new Date(bar.timestamp).toLocaleTimeString(),
        price: bar.closePrice,
        symbol: bar.symbol,
        closePrice: bar.closePrice,
      }));
      setBars(transformedData);
    });

    socketRef.current.on("bar", (data) => {
      const newBar = {
        time: new Date(data.timestamp).toLocaleTimeString(),
        price: data.closePrice,
        symbol: data.symbol,
        closePrice: data.closePrice,
      };

      setBars((prevBars) => {
        const updatedBars = [...prevBars, newBar];
        const slicedBars = updatedBars.slice(-200);
        return slicedBars;
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const requestStartStream = (tickerSymbol, timeframe) => {
    const symbol = tickerSymbol || ticker;
    if (socketRef.current && symbol) {
      socketRef.current.emit("startStream", {
        ticker: symbol.toUpperCase(),
        timeframe: timeframe,
      });
    }
  };

  const requestStopStream = () => {
    if (socketRef.current) {
      socketRef.current.emit("stopStream");
    }
  };

  const clearData = () => {
    setBars([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    requestStopStream();
    requestStartStream(ticker, "1H");
    setActiveTicker(ticker.toUpperCase());
    setTicker(""); // Clear the input field after submitting
  };

  const handleTimeframeChange = (e, timeframe) => {
    e.preventDefault();
    if (activeTicker) {
      requestStopStream();
      requestStartStream(activeTicker, timeframe);
    }
  };

  // Data is already in the right format for Recharts

  return (
    <Container maxW="100vw" p={4} className="app-container">
      <HStack spacing={4} align="stretch" h="600px">
        {/* Sidebar */}
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
            <ButtonGroup size="xs" variant="outline" colorPalette="gray.800">
              <Button onClick={(e) => handleTimeframeChange(e, "1T")}>
                1 Min
              </Button>
              <Button onClick={(e) => handleTimeframeChange(e, "5T")}>
                5 Min
              </Button>
              <Button onClick={(e) => handleTimeframeChange(e, "1H")}>
                1 Hour
              </Button>
              <Button onClick={(e) => handleTimeframeChange(e, "1D")}>
                1 Day
              </Button>
            </ButtonGroup>
            <Button
              onClick={requestStopStream}
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
                dot={(props) => (
                  <LastPointDot {...props} totalBars={bars.length} />
                )}
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
