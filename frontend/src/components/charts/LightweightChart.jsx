import React, { useEffect, useLayoutEffect, useRef } from "react";
import { createChart, LineSeries } from "lightweight-charts";

const LightweightChart = ({ bars, indicators, onHover }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const smaSeriesRef = useRef(null);

  // Initialize chart once
  useLayoutEffect(() => {
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

    // Create SMA indicator series
    const smaSeries = chart.addSeries(LineSeries, {
      color: "#f59e0b", // Orange color for SMA
      lineWidth: 1,
      lastValueVisible: false,
      priceLineVisible: false,
      title: "SMA 20",
    });

    smaSeriesRef.current = smaSeries;

    // Watch container for size changes using ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (chartContainerRef.current) {
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
      chart.unsubscribeCrosshairMove(crosshairHandler);
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []); // Initialize once, never recreate

  // Update data when bars change
  useEffect(() => {
    if (!seriesRef.current || !bars || bars.length === 0) return;

    // Bars already in correct format: { time, value }
    seriesRef.current.setData(bars);

    // Fit content to show all data
    if (chartRef.current && bars.length > 0) {
      chartRef.current.timeScale().fitContent();
    }
  }, [bars]);

  // Update indicator series when indicators change
  useEffect(() => {
    if (!smaSeriesRef.current) return;

    // Update or clear SMA20 data
    if (indicators?.sma20 && indicators.sma20.length > 0) {
      smaSeriesRef.current.setData(indicators.sma20);
    } else {
      // Clear the series if no data (important when switching timeframes)
      smaSeriesRef.current.setData([]);
    }
  }, [indicators]);

  return (
    <div
      ref={chartContainerRef}
      style={{ width: "100%", height: "100%", position: "relative" }}
    />
  );
};

export default LightweightChart;
