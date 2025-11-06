import React, { useEffect, useRef } from "react";
import { createChart, LineSeries } from "lightweight-charts";

const LightweightChart = ({ bars, onHover }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  // Initialize chart once
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Read CSS variables for colors (canvas doesn't support CSS vars)
    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue("--color-primary").trim();
    const textColor = rootStyles.getPropertyValue("--color-text").trim();
    const primaryColor20 = rootStyles
      .getPropertyValue("--color-primary-20")
      .trim();
    const primaryColor30 = rootStyles
      .getPropertyValue("--color-primary-30")
      .trim();

    // Create chart with initial dimensions
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: "solid", color: "transparent" },
        textColor: textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      crosshair: {
        mode: 0, // Normal crosshair
        vertLine: {
          color: primaryColor30,
          labelBackgroundColor: primaryColor,
        },
        horzLine: {
          color: primaryColor30,
          labelBackgroundColor: primaryColor,
        },
      },
      rightPriceScale: {
        borderColor: primaryColor20,
      },
      timeScale: {
        borderColor: primaryColor20,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Create main price series
    const lineSeries = chart.addSeries(LineSeries, {
      color: primaryColor,
      lineWidth: 2,
      lastValueVisible: true,
      priceLineVisible: true,
    });

    seriesRef.current = lineSeries;

    // Watch container for size changes using ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (chartContainerRef.current && chartRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    // Subscribe to crosshair move for hover effect
    const crosshairHandler = (param) => {
      if (param.time && param.seriesData && param.seriesData.get(lineSeries)) {
        const price = param.seriesData.get(lineSeries).value;
        onHover?.(price);
      } else {
        onHover?.(null);
      }
    };

    chart.subscribeCrosshairMove(crosshairHandler);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []); // Initialize once, never recreate

  // Update data when bars change
  useEffect(() => {
    if (!seriesRef.current || !bars || bars.length === 0) return;

    // Transform data to lightweight-charts format
    const chartData = bars.map((bar) => ({
      time: new Date(bar.time).getTime() / 1000, // Convert to Unix timestamp
      value: bar.closePrice,
    }));

    seriesRef.current.setData(chartData);

    // Fit content to show all data
    if (chartRef.current && chartData.length > 0) {
      chartRef.current.timeScale().fitContent();
    }
  }, [bars]);

  return (
    <div
      ref={chartContainerRef}
      style={{ width: "100%", height: "100%", position: "relative" }}
    />
  );
};

export default LightweightChart;
