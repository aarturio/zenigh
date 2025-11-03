import React, { useEffect, useRef } from "react";
import { createChart, LineSeries } from "lightweight-charts";

const LightweightChart = ({ bars, onHover }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

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

    // Create chart with v5 API options
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: "solid", color: "transparent" },
        textColor: textColor,
      },
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

    // Set initial size with padding for time scale
    // chart.applyOptions({
    //   width: chartContainerRef.current.clientWidth,
    //   height: chartContainerRef.current.clientHeight,
    // });

    chartRef.current = chart;

    // Create main price series using v5 API
    const lineSeries = chart.addSeries(LineSeries, {
      color: primaryColor,
      lineWidth: 2,
      lastValueVisible: true,
      priceLineVisible: true,
    });

    seriesRef.current = lineSeries;

    // Handle resize using ResizeObserver (watches container, not window)
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    // Watch the container itself for size changes
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    // Subscribe to crosshair move for hover effect
    chart.subscribeCrosshairMove((param) => {
      if (param.time && param.seriesData && param.seriesData.get(lineSeries)) {
        const price = param.seriesData.get(lineSeries).value;
        onHover?.(price);
      } else {
        onHover?.(null);
      }
    });

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  // Update chart data when bars change
  useEffect(() => {
    if (!seriesRef.current || !bars || bars.length === 0) return;

    // Transform data to lightweight-charts format
    const chartData = bars.map((bar) => ({
      time: new Date(bar.time).getTime() / 1000, // Convert to Unix timestamp
      value: bar.closePrice,
    }));

    seriesRef.current.setData(chartData);

    // Auto-fit content and scroll to show latest data with padding
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
      const timeScale = chartRef.current.timeScale();
      timeScale.scrollToPosition(5, false); // Show some padding on the right
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
