import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from "recharts";

/**
 * MACD Indicator Sub-chart
 * Displays MACD line, Signal line, and Histogram
 */
const MACDChart = ({ macdData }) => {
  if (!macdData) {
    return null;
  }

  // Create data point for the chart
  const chartData = [
    {
      macd: macdData.value,
      signal: macdData.signal,
      histogram: macdData.histogram,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis hide />
        <YAxis
          domain={["auto", "auto"]}
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => value.toFixed(4)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
          formatter={(value, name) => [value.toFixed(4), name.toUpperCase()]}
        />

        {/* Zero reference line */}
        <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1} />

        {/* MACD Histogram */}
        <Bar
          dataKey="histogram"
          fill={macdData.histogram >= 0 ? "#10b981" : "#ef4444"}
          opacity={0.6}
        />

        {/* MACD Line */}
        <Line
          type="monotone"
          dataKey="macd"
          stroke="#06b6d4"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />

        {/* Signal Line */}
        <Line
          type="monotone"
          dataKey="signal"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
          strokeDasharray="5 5"
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default MACDChart;
