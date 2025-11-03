export const styles = {
  buttonGroup: {
    bg: "var(--color-primary-10)",
    rounded: "sm",
    p: "1",
    size: "sm",
    variant: "ghost",
    colorPalette: "var(--color-primary)",
  },
  getButtonStyles: (isActive) => ({
    bg: isActive ? "var(--color-primary)" : "transparent",
    color: isActive ? "var(--color-bg)" : "var(--color-text-70)",
    _hover: {
      bg: isActive
        ? "var(--color-primary-dark)"
        : "var(--color-primary-20)",
    },
  }),
};
