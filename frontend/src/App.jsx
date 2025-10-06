import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { Box, HStack, Container, VStack } from "@chakra-ui/react";
import "./App.css";
import Chart from "./components/Chart.jsx";
import PriceCard from "./components/PriceCard.jsx";
import TimeframeButtons from "./components/TimeframeButtons.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Navbar from "./components/Navbar.jsx";

function App() {
  const [bars, setBars] = useState([]);
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
      // Transform the data to match your chart format
      const transformedData = data.map((bar) => ({
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
      setBars(transformedData);
    });

    socketRef.current.on("bar", (data) => {
      const newBar = {
        time: new Date(data.timestamp).toLocaleString([], {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        symbol: data.symbol,
        closePrice: data.closePrice,
      };

      setBars((prevBars) => {
        const updatedBars = [...prevBars, newBar];
        return updatedBars;
      });
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

  // Data is already in the right format for Recharts

  return (
    <ProtectedRoute>
      <Navbar />
      <Container maxW="100vw" p={4} className="app-container">
        <HStack spacing={4} align="stretch" h="600px">
          {/* Sidebar */}
          <Sidebar
            ticker={ticker}
            setTicker={setTicker}
            onSubmit={handleSubmit}
          />

          {/* Chart Container */}
          <Box
            className="card"
            flex="1"
            h="600px"
            p={4}
            display="flex"
            flexDirection="column"
          >
            <PriceCard bars={bars} hoveredPrice={hoveredPrice} />
            <Box flex="1" minH="0">
              <Chart bars={bars} onHover={setHoveredPrice} />
            </Box>
            <Box display="flex" justifyContent="center" mt={4}>
              <TimeframeButtons onTimeframeChange={handleTimeframeChange} />
            </Box>
          </Box>
        </HStack>
      </Container>
    </ProtectedRoute>
  );
}

export default App;
