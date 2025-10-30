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
      rounded="sm"
      p="1"
      size="sm"
      variant="ghost"
      colorPalette="var(--color-primary)"
    >
      <Button
        onClick={(e) => handleClick(e, "1T")}
        bg={activeTimeframe === "1T" ? "var(--color-primary)" : "transparent"}
        color={
          activeTimeframe === "1T" ? "var(--color-bg)" : "var(--color-text-70)"
        }
        _hover={{
          bg:
            activeTimeframe === "1T"
              ? "var(--color-primary-dark)"
              : "var(--color-primary-20)",
        }}
      >
        1M
      </Button>
      <Button
        onClick={(e) => handleClick(e, "5T")}
        bg={activeTimeframe === "5T" ? "var(--color-primary)" : "transparent"}
        color={
          activeTimeframe === "5T" ? "var(--color-bg)" : "var(--color-text-70)"
        }
        _hover={{
          bg:
            activeTimeframe === "5T"
              ? "var(--color-primary-dark)"
              : "var(--color-primary-20)",
        }}
      >
        5M
      </Button>
      <Button
        onClick={(e) => handleClick(e, "1H")}
        bg={activeTimeframe === "1H" ? "var(--color-primary)" : "transparent"}
        color={
          activeTimeframe === "1H" ? "var(--color-bg)" : "var(--color-text-70)"
        }
        _hover={{
          bg:
            activeTimeframe === "1H"
              ? "var(--color-primary-dark)"
              : "var(--color-primary-20)",
        }}
      >
        1H
      </Button>
      <Button
        onClick={(e) => handleClick(e, "1D")}
        bg={activeTimeframe === "1D" ? "var(--color-primary)" : "transparent"}
        color={
          activeTimeframe === "1D" ? "var(--color-bg)" : "var(--color-text-70)"
        }
        _hover={{
          bg:
            activeTimeframe === "1D"
              ? "var(--color-primary-dark)"
              : "var(--color-primary-20)",
        }}
      >
        1D
      </Button>
    </ButtonGroup>
  );
};

export default TimeframeButtons;
