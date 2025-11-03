import { keyframes } from "@emotion/react";

export const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const styles = {
  buttonContainer: {
    position: "fixed",
    top: { base: "auto", md: 0 },
    bottom: { base: 4, md: "auto" },
    right: { base: "50%", md: 0 },
    transform: { base: "translateX(50%)", md: "none" },
    p: { base: 4, md: 6 },
    zIndex: 10,
  },
  authButton: {
    size: "sm",
    fontSize: "sm",
    fontWeight: "500",
    letterSpacing: "wide",
    h: { base: "44px", md: "30px" },
    minW: { base: "120px", md: "90px" },
    borderRadius: "24px",
  },
  dialogContent: {
    bg: "var(--color-bg)",
    borderColor: "var(--color-primary-20)",
    borderWidth: 1,
    position: "fixed",
    top: { base: "50%", md: "60px" },
    right: { base: "50%", md: "24px" },
    left: { base: "50%", md: "auto" },
    transform: { base: "translate(-50%, -50%)", md: "none" },
    maxW: { base: "90%", sm: "400px", md: "400px" },
    mx: { base: "auto", md: 0 },
  },
  dialogBackdrop: {
    bg: "var(--color-overlay)",
    backdropFilter: "blur(5px)",
  },
  dialogCloseTrigger: {
    color: "var(--color-text-60)",
    _hover: { color: "var(--color-text)" },
  },
  brandContainer: {
    minH: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandHeading: {
    fontSize: { base: "5xl", md: "7xl" },
    fontWeight: "300",
    color: "var(--color-text)",
    letterSpacing: "tight",
    lineHeight: "1.2",
    opacity: 0,
  },
};
