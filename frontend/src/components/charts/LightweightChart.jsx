import React, { useEffect, useLayoutEffect, useRef } from "react";
import { createChart, LineSeries } from "lightweight-charts";
import { INDICATOR_CATEGORIES } from "../layout/IndicatorControl";

const LightweightChart = ({
  bars,
  indicators,
  selectedIndicators = [],
  onHover,
}) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const indicatorSeriesRef = useRef({});

  // Get indicator config by ID
  const getIndicatorConfig = (indicatorId) => {
    for (const category of Object.values(INDICATOR_CATEGORIES)) {
      const indicator = category.indicators.find(
        (ind) => ind.id === indicatorId
      );
      if (indicator) return indicator;
    }
    return null;
  };

  // Initialize chart once
  useLayoutEffect(() => {
    // Read Chakra CSS variables for colors (canvas doesn't support CSS vars)
    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor =
      rootStyles.getPropertyValue("--chakra-colors-brand-teal").trim() ||
      "#1bf2d9";
    const textColor =
      rootStyles.getPropertyValue("--chakra-colors-text-primary").trim() ||
      "#ffffff";
    const primaryColor30 =
      rootStyles.getPropertyValue("--chakra-colors-teal-30").trim() ||
      "rgba(27, 242, 217, 0.3)";

    // Create chart with initial dimensions
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: "solid", color: "transparent" },
        textColor: textColor,
        attributionLogo: false,
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
        borderColor: "transparent",
      },
      timeScale: {
        borderColor: "transparent",
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

  // Manage indicator series based on selectedIndicators
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = chartRef.current;

    // Remove series that are no longer selected
    Object.keys(indicatorSeriesRef.current).forEach((indicatorId) => {
      if (!selectedIndicators.includes(indicatorId)) {
        chart.removeSeries(indicatorSeriesRef.current[indicatorId]);
        delete indicatorSeriesRef.current[indicatorId];
      }
    });

    // Add new series for newly selected indicators
    selectedIndicators.forEach((indicatorId) => {
      if (!indicatorSeriesRef.current[indicatorId]) {
        const config = getIndicatorConfig(indicatorId);
        if (config) {
          const series = chart.addSeries(LineSeries, {
            color: config.color,
            lineWidth: 1,
            lastValueVisible: false,
            priceLineVisible: false,
            title: config.label,
          });
          indicatorSeriesRef.current[indicatorId] = series;
        }
      }
    });
  }, [selectedIndicators]);

  // Update indicator data
  useEffect(() => {
    if (!indicators || Object.keys(indicators).length === 0) return;

    selectedIndicators.forEach((indicatorId) => {
      const series = indicatorSeriesRef.current[indicatorId];
      const indicatorKey = indicatorId.toLowerCase();

      if (series && indicators[indicatorKey]) {
        series.setData(indicators[indicatorKey]);
      } else if (series) {
        // Clear if no data
        series.setData([]);
      }
    });
  }, [indicators, selectedIndicators]);

  return (
    <div
      ref={chartContainerRef}
      style={{ width: "100%", height: "100%", position: "relative" }}
    />
  );
};

export default LightweightChart;
