import { Button, ButtonGroup } from "@chakra-ui/react";
import { useState } from "react";

const TimeframeButtons = ({ onTimeframeChange }) => {
  const [activeTimeframe, setActiveTimeframe] = useState("1H");

  const handleClick = (e, timeframe) => {
    setActiveTimeframe(timeframe);
    onTimeframeChange?.(e, timeframe);
  };

  return (
    <ButtonGroup
      bg="gray.100"
      rounded="lg"
      p="1"
      size="sm"
      variant="ghost"
      colorPalette="gray"
    >
      <Button
        onClick={(e) => handleClick(e, "1T")}
        bg={activeTimeframe === "1T" ? "white" : "transparent"}
        shadow={activeTimeframe === "1T" ? "sm" : "none"}
      >
        1 Min
      </Button>
      <Button
        onClick={(e) => handleClick(e, "5T")}
        bg={activeTimeframe === "5T" ? "white" : "transparent"}
        shadow={activeTimeframe === "5T" ? "sm" : "none"}
      >
        5 Min
      </Button>
      <Button
        onClick={(e) => handleClick(e, "1H")}
        bg={activeTimeframe === "1H" ? "white" : "transparent"}
        shadow={activeTimeframe === "1H" ? "sm" : "none"}
      >
        1 Hour
      </Button>
      <Button
        onClick={(e) => handleClick(e, "1D")}
        bg={activeTimeframe === "1D" ? "white" : "transparent"}
        shadow={activeTimeframe === "1D" ? "sm" : "none"}
      >
        1 Day
      </Button>
    </ButtonGroup>
  );
};

export default TimeframeButtons;
