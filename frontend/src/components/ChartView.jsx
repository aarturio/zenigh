import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { Box, HStack, Container, VStack, Text } from "@chakra-ui/react";
import Chart from "./Chart.jsx";
import PriceCard from "./PriceCard.jsx";
import TimeframeButtons from "./TimeframeButtons.jsx";
import Sidebar from "./Sidebar.jsx";
import MACDChart from "./MACDChart.jsx";
import RSIChart from "./RSIChart.jsx";

function ChartView() {
  const [bars, setBars] = useState([]);
  const [indicators, setIndicators] = useState(null);
  const [enabledIndicators, setEnabledIndicators] = useState({
    sma20: false,
    sma50: false,
    sma200: false,
    ema12: false,
    ema26: false,
    macd: false,
    rsi: false,
  });
  const [ticker, setTicker] = useState("");
  const [activeTicker, setActiveTicker] = useState(null);
  const [hoveredPrice, setHoveredPrice] = useState(null);
  const socketRef = useRef(null);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    requestStopStream();
    requestStartStream(ticker, "1H");
    setActiveTicker(ticker.toUpperCase());
    setTicker(""); // Clear the input field after submitting
  };

  useEffect(() => {
    // Connect to WebSocket server
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    socketRef.current = io(BACKEND_URL);

    socketRef.current.on("connect", () => {
      console.log("Connected to server");
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socketRef.current.on("historicalData", (data) => {
      // Backend now sends {bars, indicators}
      const barData = data.bars || data;
      const indicatorData = data.indicators;

      // Transform the data to match your chart format
      const transformedData = barData.map((bar) => ({
        time: new Date(bar.timestamp).toLocaleString([], {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        symbol: bar.symbol,
        closePrice: bar.closePrice,
      }));
      // Keep only last 30 data points
      setBars(transformedData.slice(-30));

      // Store initial indicators
      if (indicatorData) {
        setIndicators(indicatorData);
      }
    });

    socketRef.current.on("bar", (data) => {
      // Backend now sends {bar, indicators}
      const barData = data.bar || data;
      const indicatorData = data.indicators;

      const newBar = {
        time: new Date(barData.timestamp).toLocaleString([], {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        symbol: barData.symbol,
        closePrice: barData.closePrice,
      };

      setBars((prevBars) => {
        const updatedBars = [...prevBars, newBar];
        // Keep only last 30 data points
        return updatedBars.slice(-30);
      });

      // Update indicators in real-time
      if (indicatorData) {
        setIndicators(indicatorData);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleTimeframeChange = (e, timeframe) => {
    e.preventDefault();
    if (activeTicker) {
      requestStopStream();
      requestStartStream(activeTicker, timeframe);
    }
  };

  const handleIndicatorToggle = (indicatorId) => {
    setEnabledIndicators((prev) => ({
      ...prev,
      [indicatorId]: !prev[indicatorId],
    }));
  };

  return (
    <Container maxW="100vw" p={4} className="app-container" bg="var(--color-bg)">
      <HStack spacing={4} align="stretch" h="calc(100vh - 100px)">
        {/* Sidebar */}
        <Sidebar
          ticker={ticker}
          setTicker={setTicker}
          onSubmit={handleSubmit}
          enabledIndicators={enabledIndicators}
          onIndicatorToggle={handleIndicatorToggle}
        />

        {/* Main Chart Area */}
        <VStack flex="1" spacing={4} align="stretch" h="100%">
          {/* Price Chart Container */}
          <Box
            className="card"
            flex="1"
            p={4}
            display="flex"
            flexDirection="column"
            minH="0"
          >
            <PriceCard bars={bars} hoveredPrice={hoveredPrice} />
            <Box flex="1" minH="0">
              <Chart
                bars={bars}
                onHover={setHoveredPrice}
                indicators={indicators}
                enabledIndicators={enabledIndicators}
              />
            </Box>
            <Box display="flex" justifyContent="center" mt={4}>
              <TimeframeButtons onTimeframeChange={handleTimeframeChange} />
            </Box>
          </Box>

          {/* Oscillator Charts Row - Always rendered, hidden when toggled off */}
          <HStack spacing={4} align="stretch" h="200px">
            {/* MACD Chart */}
            <Box
              className="card"
              flex="1"
              h="100%"
              p={4}
              display={enabledIndicators.macd ? "flex" : "none"}
              flexDirection="column"
            >
              <Box fontSize="sm" fontWeight="bold" mb={2} color="var(--color-text)">
                MACD
              </Box>
              <Box flex="1" minH="0">
                <MACDChart macdData={indicators?.macd} />
              </Box>
            </Box>

            {/* RSI Chart */}
            <Box
              className="card"
              flex="1"
              h="100%"
              p={4}
              display={enabledIndicators.rsi ? "flex" : "none"}
              flexDirection="column"
            >
              <Box fontSize="sm" fontWeight="bold" mb={2} color="var(--color-text)">
                RSI
              </Box>
              <Box flex="1" minH="0">
                <RSIChart rsiData={indicators?.rsi} />
              </Box>
            </Box>

            {/* Placeholder when no oscillators are enabled */}
            {!enabledIndicators.macd && !enabledIndicators.rsi && (
              <Box
                className="card"
                flex="1"
                h="100%"
                p={4}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text color="var(--color-text-50)" fontSize="sm">
                  Toggle MACD or RSI to view oscillators
                </Text>
              </Box>
            )}
          </HStack>
        </VStack>
      </HStack>
    </Container>
  );
}

export default ChartView;
