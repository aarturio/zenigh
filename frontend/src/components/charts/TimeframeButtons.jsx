import { Button, ButtonGroup } from "@chakra-ui/react";
import { useState } from "react";

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
    <ButtonGroup rounded="sm" p={1} size="sm" variant="ghost">
      {timeframes.map(({ value, label }) => {
        const isActive = activeTimeframe === value;
        return (
          <Button
            key={value}
            variant="ghost"
            onClick={(e) => handleClick(e, value)}
            bg={isActive ? "text.secondary" : "transparent"}
            color={isActive ? "bg.primary" : "fg.secondary"}
            _hover={{
              bg: isActive ? "text.tertiary" : "text.subtle",
            }}
          >
            {label}
          </Button>
        );
      })}
    </ButtonGroup>
  );
};

export default TimeframeButtons;
