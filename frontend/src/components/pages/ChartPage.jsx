import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { Box } from "@chakra-ui/react";
import Navbar from "../layout/Navbar.jsx";
import ChartView from "../charts/ChartView.jsx";

function ChartPage() {
  const [bars, setBars] = useState([]);
  const [indicators, setIndicators] = useState({});
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
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
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

    socketRef.current.on("dbBars", (data) => {
      // Backend sends { bars: [{time, value}], indicators: { sma20: [{time, value}] } }
      // console.log("=== dbBars event received ===");
      // console.log("Bars count:", data.bars?.length);
      // console.log("Latest bar:", data.bars?.[data.bars.length - 1]);
      // console.log("SMA20 count:", data.indicators?.sma20?.length);
      // console.log("Latest SMA20:", data.indicators?.sma20?.[data.indicators.sma20.length - 1]);
      // console.log("Time difference (SMA - Price):",
      //   (data.indicators?.sma20?.[data.indicators.sma20.length - 1]?.time || 0) -
      //   (data.bars?.[data.bars.length - 1]?.time || 0)
      // );

      if (data.bars) {
        setBars(data.bars);
      }
      if (data.indicators) {
        setIndicators(data.indicators);
      }
    });

    socketRef.current.on("bar", (data) => {
      // Backend sends { bar: {time, value} }
      if (data.bar) {
        setBars((prevBars) => [...prevBars, data.bar]);
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

  return (
    <Box>
      <Navbar ticker={ticker} setTicker={setTicker} onSubmit={handleSubmit} />
      <ChartView
        bars={bars}
        indicators={indicators}
        hoveredPrice={hoveredPrice}
        setHoveredPrice={setHoveredPrice}
        aiOutput={aiOutput}
        handleTimeframeChange={handleTimeframeChange}
        ticker={activeTicker}
      />
    </Box>
  );
}

export default ChartPage;
