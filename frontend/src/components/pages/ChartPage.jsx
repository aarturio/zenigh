import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { Box } from "@chakra-ui/react";
import Navbar from "../layout/Navbar.jsx";
import ChartView from "../charts/ChartView.jsx";

function ChartPage() {
  const [bars, setBars] = useState([]);
  const [ticker, setTicker] = useState("");
  const [activeTicker, setActiveTicker] = useState(null);
  const [hoveredPrice, setHoveredPrice] = useState(null);
  const [aiOutput, setAiOutput] = useState("");
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
    const BACKEND_URL =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
    socketRef.current = io(BACKEND_URL, {
      withCredentials: true, // Send cookies with WebSocket connection
    });

    socketRef.current.on("connect", () => {
      console.log("Connected to server");
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Connection failed:", error.message);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socketRef.current.on("historicalData", (data) => {
      // Backend now sends {bars, indicators}
      const barData = data.bars || data;

      // Transform the data to match your chart format
      const transformedData = barData.map((bar) => ({
        time: bar.timestamp,
        symbol: bar.symbol,
        closePrice: bar.closePrice,
      }));
      setBars(transformedData);
    });

    socketRef.current.on("bar", (data) => {
      // Backend now sends {bar, indicators}
      const barData = data.bar || data;

      const newBar = {
        time: barData.timestamp,
        symbol: barData.symbol,
        closePrice: barData.closePrice,
      };

      setBars((prevBars) => [...prevBars, newBar]);
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

  return (
    <Box>
      <Navbar ticker={ticker} setTicker={setTicker} onSubmit={handleSubmit} />
      <ChartView
        bars={bars}
        hoveredPrice={hoveredPrice}
        setHoveredPrice={setHoveredPrice}
        aiOutput={aiOutput}
        handleTimeframeChange={handleTimeframeChange}
      />
    </Box>
  );
}

export default ChartPage;
