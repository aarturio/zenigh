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

const Chart = ({ bars, onHover }) => {
  const [lastActiveIndex, setLastActiveIndex] = React.useState(null);

  return (
    <ResponsiveContainer width="100%" height="100%" color="teal.500">
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
            border: "1px solid #ccc",
            borderRadius: "8px",
            color: "teal",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
        <Line
          type="monotone"
          dataKey="closePrice"
          stroke="teal"
          strokeWidth={2}
          dot={(props) => {
            const { key, ...dotProps } = props;
            return (
              <LastPointDot key={key} {...dotProps} totalBars={bars.length} />
            );
          }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default Chart;
