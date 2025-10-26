import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import LastPointDot from "./PulsingDot.jsx";

const Chart = ({ bars, onHover, indicators, enabledIndicators }) => {
  const [lastActiveIndex, setLastActiveIndex] = React.useState(null);

  // Define indicator display configurations
  const indicatorConfigs = {
    sma20: { color: "#10b981", strokeWidth: 1.5, dataKey: "sma_20" },
    sma50: { color: "#3b82f6", strokeWidth: 1.5, dataKey: "sma_50" },
    sma200: { color: "#8b5cf6", strokeWidth: 1.5, dataKey: "sma_200" },
    ema12: { color: "#f59e0b", strokeWidth: 1.5, dataKey: "ema_12" },
    ema26: { color: "#ef4444", strokeWidth: 1.5, dataKey: "ema_26" },
  };

  // Helper function to get nested indicator value
  const getIndicatorValue = (dataKey) => {
    if (!indicators) return null;

    // SMA indicators
    if (dataKey.startsWith("sma_")) {
      return indicators.sma?.[dataKey] ?? null;
    }
    // EMA indicators
    if (dataKey.startsWith("ema_")) {
      return indicators.ema?.[dataKey] ?? null;
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={bars}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        onMouseMove={(e) => {
          if (
            e &&
            e.activeTooltipIndex !== undefined &&
            bars[e.activeTooltipIndex] &&
            e.activeTooltipIndex !== lastActiveIndex
          ) {
            const hoveredData = bars[e.activeTooltipIndex];
            onHover(hoveredData.closePrice);
            setLastActiveIndex(e.activeTooltipIndex);
          }
        }}
        onMouseLeave={() => {
          onHover(null);
          setLastActiveIndex(null);
        }}
      >
        <XAxis dataKey="time" hide={true} />
        <YAxis hide={true} domain={["dataMin - 1", "dataMax + 1"]} />
        <Tooltip
          labelFormatter={(label) => label}
          formatter={() => []}
          contentStyle={{
            backgroundColor: "var(--color-bg)",
            border: "1px solid var(--color-primary-30)",
            borderRadius: "8px",
            color: "var(--color-primary)",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
        <Line
          type="monotone"
          dataKey="closePrice"
          stroke="var(--color-primary)"
          strokeWidth={2}
          dot={(props) => {
            const { key, ...dotProps } = props;
            return (
              <LastPointDot key={key} {...dotProps} totalBars={bars.length} />
            );
          }}
          isAnimationActive={false}
        />

        {/* Render indicator lines conditionally */}
        {Object.entries(indicatorConfigs).map(([id, config]) => {
          // Only render if indicator is enabled and has data
          if (
            enabledIndicators?.[id] &&
            getIndicatorValue(config.dataKey) !== null
          ) {
            const indicatorValue = getIndicatorValue(config.dataKey);

            return (
              <Line
                key={id}
                type="monotone"
                dataKey={() => indicatorValue}
                stroke={config.color}
                strokeWidth={config.strokeWidth}
                dot={false}
                isAnimationActive={false}
                strokeDasharray={id.startsWith("ema") ? "5 5" : undefined}
              />
            );
          }
          return null;
        })}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default Chart;
