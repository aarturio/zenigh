import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "./App.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [bars, setBars] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const socketRef = useRef(null);
  const maxDataPoints = 50;

  useEffect(() => {
    // Connect to WebSocket server
    socketRef.current = io("http://localhost:3000");

    socketRef.current.on("connect", () => {
      console.log("Connected to server");
      setConnectionStatus("connected");
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from server");
      setConnectionStatus("disconnected");
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

  const startStream = () => {
    if (socketRef.current) {
      socketRef.current.emit("startStream");
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

  // Prepare chart data
  const chartData = {
    labels: bars.map((bar) => bar.time),
    datasets: [
      {
        label: "Bar Price",
        data: bars.map((bar) => bar.closePrice),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Real-Time Stock Bar",
      },
    },
    scales: {
      x: {
        display: false, // Hide x-axis labels for cleaner look
      },
      y: {
        beginAtZero: false,
      },
    },
    animation: {
      duration: 0, // Disable animation for real-time data
    },
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Zenigh - Real-Time Market Data</h1>
        <div className="connection-status">
          Status:{" "}
          <span className={`status ${connectionStatus}`}>
            {connectionStatus}
          </span>
        </div>
      </header>

      <div className="controls">
        <button
          onClick={startStream}
          disabled={isStreaming || connectionStatus !== "connected"}
          className="btn btn-start"
        >
          {isStreaming ? "Streaming..." : "Start Stream"}
        </button>
        <button
          onClick={stopStream}
          disabled={!isStreaming}
          className="btn btn-stop"
        >
          Stop Stream
        </button>
        <button onClick={clearData} className="btn btn-clear">
          Clear Data
        </button>
      </div>

      <div className="chart-container">
        <Line data={chartData} options={chartOptions} />
      </div>

      <div className="bar-info">
        <div className="bar-count">Bars: {bars.length}</div>
        {bars.length > 0 && (
          <div className="latest-bar">
            <strong>Latest:</strong> {bars[bars.length - 1].symbol} - $
            {bars[bars.length - 1].closePrice}({bars[bars.length - 1].time})
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
