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
      bg="var(--color-primary-10)"
      rounded="lg"
      p="1"
      size="sm"
      variant="ghost"
      colorPalette="teal"
    >
      <Button
        onClick={(e) => handleClick(e, "1T")}
        bg={activeTimeframe === "1T" ? "var(--color-primary)" : "transparent"}
        color={activeTimeframe === "1T" ? "var(--color-bg)" : "var(--color-text-70)"}
        _hover={{ bg: activeTimeframe === "1T" ? "var(--color-primary-dark)" : "var(--color-primary-20)" }}
        shadow={activeTimeframe === "1T" ? "sm" : "none"}
      >
        1 Min
      </Button>
      <Button
        onClick={(e) => handleClick(e, "5T")}
        bg={activeTimeframe === "5T" ? "var(--color-primary)" : "transparent"}
        color={activeTimeframe === "5T" ? "var(--color-bg)" : "var(--color-text-70)"}
        _hover={{ bg: activeTimeframe === "5T" ? "var(--color-primary-dark)" : "var(--color-primary-20)" }}
        shadow={activeTimeframe === "5T" ? "sm" : "none"}
      >
        5 Min
      </Button>
      <Button
        onClick={(e) => handleClick(e, "1H")}
        bg={activeTimeframe === "1H" ? "var(--color-primary)" : "transparent"}
        color={activeTimeframe === "1H" ? "var(--color-bg)" : "var(--color-text-70)"}
        _hover={{ bg: activeTimeframe === "1H" ? "var(--color-primary-dark)" : "var(--color-primary-20)" }}
        shadow={activeTimeframe === "1H" ? "sm" : "none"}
      >
        1 Hour
      </Button>
      <Button
        onClick={(e) => handleClick(e, "1D")}
        bg={activeTimeframe === "1D" ? "var(--color-primary)" : "transparent"}
        color={activeTimeframe === "1D" ? "var(--color-bg)" : "var(--color-text-70)"}
        _hover={{ bg: activeTimeframe === "1D" ? "var(--color-primary-dark)" : "var(--color-primary-20)" }}
        shadow={activeTimeframe === "1D" ? "sm" : "none"}
      >
        1 Day
      </Button>
    </ButtonGroup>
  );
};

export default TimeframeButtons;
