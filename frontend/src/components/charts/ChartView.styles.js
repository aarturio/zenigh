export const styles = {
  container: {
    maxW: "100vw",
    p: 4,
    className: "app-container",
    bg: "var(--color-bg)",
  },
  mainLayout: {
    spacing: 4,
    align: "stretch",
    h: "calc(100vh - 100px)",
  },
  priceChartContainer: {
    className: "card",
    flex: "1",
    p: 4,
    display: "flex",
    flexDirection: "column",
    minH: "0",
  },
  priceCardWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  chartWrapper: {
    flex: "1",
    minH: "0",
    position: "relative",
    mb: 4,
    pb: 4,
  },
  timeframeButtonContainer: {
    display: "flex",
    justifyContent: "center",
    position: "relative",
    zIndex: 10,
  },
};
