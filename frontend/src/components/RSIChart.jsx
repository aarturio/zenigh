import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";

/**
 * RSI Indicator Sub-chart
 * Displays RSI with overbought (70) and oversold (30) zones
 */
const RSIChart = ({ rsiData }) => {
  if (!rsiData) {
    return null;
  }

  // Create data point for the chart
  const chartData = [
    {
      rsi: rsiData.value,
      overbought: 70,
      oversold: 30,
    },
  ];

  // Determine color based on RSI signal
  const getRSIColor = () => {
    if (rsiData.signal === "overbought") return "#ef4444";
    if (rsiData.signal === "oversold") return "#10b981";
    return "#ec4899";
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-text-10)" />
        <XAxis hide />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--color-text)" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-bg)",
            border: "1px solid var(--color-primary-30)",
            borderRadius: "8px",
            color: "var(--color-text)",
          }}
          formatter={(value, name) => {
            if (name === "rsi") {
              return [
                `${value.toFixed(2)} (${rsiData.signal})`,
                "RSI",
              ];
            }
            return null;
          }}
        />

        {/* Overbought zone (70) */}
        <ReferenceLine
          y={70}
          stroke="#ef4444"
          strokeDasharray="3 3"
          label={{
            value: "Overbought",
            position: "right",
            fontSize: 10,
            fill: "#ef4444",
          }}
        />

        {/* Oversold zone (30) */}
        <ReferenceLine
          y={30}
          stroke="#10b981"
          strokeDasharray="3 3"
          label={{
            value: "Oversold",
            position: "right",
            fontSize: 10,
            fill: "#10b981",
          }}
        />

        {/* Middle line (50) */}
        <ReferenceLine y={50} stroke="var(--color-text-40)" strokeWidth={1} />

        {/* RSI Line */}
        <Line
          type="monotone"
          dataKey="rsi"
          stroke={getRSIColor()}
          strokeWidth={2.5}
          dot={{
            r: 5,
            fill: getRSIColor(),
            strokeWidth: 2,
            stroke: "var(--color-text)",
          }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RSIChart;
