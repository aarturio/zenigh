import { Button, ButtonGroup } from "@chakra-ui/react";
import { useState } from "react";
import { styles } from "./TimeframeButtons.styles";

const TimeframeButtons = ({ onTimeframeChange }) => {
  const [activeTimeframe, setActiveTimeframe] = useState("1H");

  const handleClick = (e, timeframe) => {
    setActiveTimeframe(timeframe);
    onTimeframeChange?.(e, timeframe);
  };

  const timeframes = [
    { value: "1T", label: "1M" },
    { value: "5T", label: "5M" },
    { value: "1H", label: "1H" },
    { value: "1D", label: "1D" },
  ];

  return (
    <ButtonGroup {...styles.buttonGroup}>
      {timeframes.map(({ value, label }) => (
        <Button
          key={value}
          onClick={(e) => handleClick(e, value)}
          {...styles.getButtonStyles(activeTimeframe === value)}
        >
          {label}
        </Button>
      ))}
    </ButtonGroup>
  );
};

export default TimeframeButtons;
