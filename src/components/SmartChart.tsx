import {
  Download,
  Maximize2,
  Move,
  RotateCcw,
  Settings,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Plot from "react-plotly.js";

interface ChartData {
  type:
    | "line"
    | "bar"
    | "pie"
    | "scatter"
    | "area"
    | "histogram"
    | "plotly"
    | "stacked_bar"
    | "heatmap"
    | "boxplot";
  data: any[];
  title?: string;
  x_label?: string;
  y_label?: string;
  column?: string;
  plotly_data?: any;
  plotly_layout?: any;
  series?: { [key: string]: any[] } | string[]; // For area charts with multiple y-series
  series_column?: string; // For grouped area charts (the column used for grouping)
  x?: string | string[];
  y?: string | string[];
  // New properties for new chart types
  bars?: { [key: string]: any[] }; // For stacked bar charts
  y_cols?: string[]; // Column names for stacked bar
  z?: number[][]; // For heatmap z-values
  columns?: string[]; // For boxplot column names
}

interface SmartChartProps {
  chartData: ChartData | any;
  className?: string;
  height?: number;
}

export default function SmartChart({
  chartData,
  className = "",
  height = 300,
}: SmartChartProps) {
  const [showDebug, setShowDebug] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [panEnabled, setPanEnabled] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const chartRef = useRef<any>(null);

  // Zoom and interaction functions
  const handleZoomIn = () => {
    // Plotly handles zoom natively through its built-in controls
    setZoomLevel((prev) => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    // Plotly handles zoom natively through its built-in controls
    setZoomLevel((prev) => Math.max(prev / 1.2, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handlePanStart = (event: React.MouseEvent) => {
    if (!panEnabled) return;
    setIsDragging(true);
    setDragStart({ x: event.clientX, y: event.clientY });
  };

  const handlePanMove = (event: React.MouseEvent) => {
    if (!panEnabled || !isDragging) return;

    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;

    // Convert pixel movement to percentage of data range
    const panSensitivity = 0.5;
    const newPanOffset = {
      x: panOffset.x + deltaX * panSensitivity, // Positive delta = move right
      y: panOffset.y - deltaY * panSensitivity, // Negative delta for natural feel (up = positive)
    };

    // Limit pan range to reasonable bounds
    newPanOffset.x = Math.max(-200, Math.min(200, newPanOffset.x));
    newPanOffset.y = Math.max(-200, Math.min(200, newPanOffset.y));

    setPanOffset(newPanOffset);
    setDragStart({ x: event.clientX, y: event.clientY });
  };

  const handlePanEnd = () => {
    setIsDragging(false);
  };

  const togglePan = () => {
    setPanEnabled(!panEnabled);
  };

  const downloadChart = () => {
    // Plotly charts have built-in download functionality via the mode bar
    // The download button will appear in the chart's toolbar when hovering
    console.log("Chart download - use the camera icon in the chart toolbar");
  };

  // Handle escape key to close fullscreen
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when fullscreen is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isFullscreen]);

  // Convert all chart types to Plotly format
  const processSimpleChartData = (data: any) => {
    switch (data.type) {
      case "histogram":
        // Handle new histogram format with bins array
        if (
          Array.isArray(data.data) &&
          data.data.length > 0 &&
          data.data[0].range &&
          data.data[0].count !== undefined
        ) {
          // New format: bins array with range and count
          return {
            type: "bar",
            title: data.title || `Distribution of ${data.column}`,
            x_label: data.column || "Value Range",
            y_label: "Frequency",
            data: data.data.map((bin: any) => ({
              label: `${bin.range[0].toFixed(1)}-${bin.range[1].toFixed(1)}`,
              value: bin.count,
            })),
          };
        } else {
          // Legacy format: Convert histogram data to bar chart format
          const counts: { [key: string]: number } = {};

          // Process the data to create buckets
          data.data.forEach((value: any) => {
            let numValue: number;

            // Handle different data types
            if (typeof value === "string") {
              // Try to parse as number first
              numValue = parseFloat(value);
              if (isNaN(numValue)) {
                // If not a number, use the string as a category
                counts[value] = (counts[value] || 0) + 1;
                return;
              }
            } else if (typeof value === "number") {
              numValue = value;
            } else {
              // Default to 0 for other types
              numValue = 0;
            }

            // Create buckets for numeric data
            const bucketSize = Math.max(
              1,
              Math.floor(Math.abs(numValue) / 10) || 1
            );
            const bucket = Math.floor(numValue / bucketSize) * bucketSize;
            const key = `${bucket}-${bucket + bucketSize}`;
            counts[key] = (counts[key] || 0) + 1;
          });

          return {
            type: "bar",
            title: data.title || `Distribution of ${data.column}`,
            x_label: data.column || "Value Range",
            y_label: "Frequency",
            data: Object.entries(counts).map(([range, count]) => ({
              label: range,
              value: count,
            })),
          };
        }

      case "line":
        // Convert line data to proper format
        if (Array.isArray(data.data)) {
          // Check if data is already in {x, y} format (new tool format)
          if (
            data.data.length > 0 &&
            typeof data.data[0] === "object" &&
            data.data[0].hasOwnProperty("x") &&
            data.data[0].hasOwnProperty("y")
          ) {
            // Data is already in correct format, just ensure proper structure
            return {
              type: "line",
              title: data.title || "Line Chart",
              x_label: data.x_label || "X",
              y_label: data.y_label || "Y",
              data: data.data.map((point: any) => ({
                x: point.x,
                y: typeof point.y === "string" ? parseFloat(point.y) : point.y,
                label: `${point.x}: ${point.y}`,
              })),
            };
          }

          // Legacy format: check if data contains dates
          const isDateData = data.data.some((value: any) => {
            if (typeof value === "string") {
              // Check for date patterns like "2/24/2003 0:00"
              return (
                /^\d{1,2}\/\d{1,2}\/\d{4}/.test(value) ||
                !isNaN(Date.parse(value))
              );
            }
            return false;
          });

          if (isDateData) {
            // Handle date data - convert to simplified format for visualization
            return {
              type: "line",
              title: data.title || `${data.column} Over Time`,
              x_label: "Time Period",
              y_label: "Count",
              data: data.data.map((value: any, _index: number) => {
                let displayValue = value;
                if (
                  typeof value === "string" &&
                  /^\d{1,2}\/\d{1,2}\/\d{4}/.test(value)
                ) {
                  // Convert date to a simpler format for display
                  const date = new Date(value);
                  displayValue = date.getFullYear().toString();
                }
                return {
                  x: displayValue,
                  y: 1, // Count of 1 for each data point
                  label: displayValue,
                };
              }),
            };
          } else {
            // Handle numeric or other data
            return {
              type: "line",
              title: data.title || `${data.column} Over Time`,
              x_label: "Index",
              y_label: data.column || "Value",
              data: data.data.map((value: any, index: number) => ({
                x: index + 1,
                y:
                  typeof value === "number"
                    ? value
                    : parseFloat(value) || index,
                label: value,
              })),
            };
          }
        }
        break;

      case "bar":
        // Handle new bar format with bars array
        if (
          Array.isArray(data.data) &&
          data.data.length > 0 &&
          data.data[0].label !== undefined &&
          data.data[0].value !== undefined
        ) {
          // New format: bars array with label and value
          return {
            type: "bar",
            title: data.title || `${data.y} by ${data.x}`,
            x_label: data.x || "Category",
            y_label: data.y || "Value",
            data: data.data,
          };
        } else {
          // Legacy format: already in correct format, just ensure proper structure
          return {
            type: "bar",
            title: data.title || `${data.column} Analysis`,
            x_label: data.x_label || "Category",
            y_label: data.y_label || "Value",
            data: data.data,
          };
        }

      case "pie":
        // Handle new pie format with slices array
        if (
          Array.isArray(data.data) &&
          data.data.length > 0 &&
          data.data[0].label !== undefined &&
          data.data[0].value !== undefined
        ) {
          // New format: slices array with label and value
          return {
            type: "pie",
            title: data.title || `${data.column} Distribution`,
            data: data.data,
          };
        } else {
          // Legacy format: already in correct format
          return {
            type: "pie",
            title: data.title || `${data.column} Distribution`,
            data: data.data,
          };
        }

      case "scatter":
        // Handle scatter plot with points array
        if (
          Array.isArray(data.data) &&
          data.data.length > 0 &&
          typeof data.data[0] === "object" &&
          data.data[0].hasOwnProperty("x") &&
          data.data[0].hasOwnProperty("y")
        ) {
          // Data is in {x, y} format
          return {
            type: "scatter",
            title: data.title || `${data.y} vs ${data.x}`,
            x_label: data.x || "X",
            y_label: data.y || "Y",
            data: data.data.map((point: any) => ({
              x:
                typeof point.x === "string"
                  ? parseFloat(point.x) || point.x
                  : point.x,
              y: typeof point.y === "string" ? parseFloat(point.y) : point.y,
              label: `${point.x}: ${point.y}`,
            })),
          };
        }
        break;

      case "stacked_bar":
        // Handle new stacked bar format
        if (data.bars && data.x && data.y_cols) {
          // Convert stacked bar data to generic format
          const stackedData = data.x.map((xValue: string, index: number) => {
            const dataPoint: any = { x: xValue };
            data.y_cols.forEach((col: string) => {
              dataPoint[col] = data.bars[col] ? data.bars[col][index] || 0 : 0;
            });
            return dataPoint;
          });

          return {
            type: "stacked_bar",
            title: data.title || "Stacked Bar Chart",
            x_label: data.x_label || "Category",
            y_label: data.y_label || "Value",
            data: stackedData,
            y_cols: data.y_cols,
          };
        }
        break;

      case "heatmap":
        // Heatmap - return in generic format for consistent processing
        if (data.x && data.y && data.z) {
          return {
            type: "heatmap",
            title: data.title || "Heatmap",
            x_label: data.x_label || "X Axis",
            y_label: data.y_label || "Y Axis",
            x: data.x,
            y: data.y,
            z: data.z,
          };
        }
        break;

      case "boxplot":
        // Boxplot - return in generic format for consistent processing
        if (data.columns && data.data) {
          return {
            type: "boxplot",
            title: data.title || "Box Plot",
            x_label: data.x_label || "Categories",
            y_label: data.y_label || "Values",
            columns: data.columns,
            data: data.data,
          };
        }
        break;

      case "area":
        // Handle area chart with series object
        if (typeof data.data === "object" && !Array.isArray(data.data)) {
          // New format: series object with multiple y columns
          const seriesKeys = Object.keys(data.data);

          if (seriesKeys.length > 0) {
            const firstSeries = seriesKeys[0];
            const firstSeriesData = data.data[firstSeries];

            if (
              Array.isArray(firstSeriesData) &&
              firstSeriesData.length > 0 &&
              typeof firstSeriesData[0] === "object" &&
              firstSeriesData[0].hasOwnProperty("x") &&
              firstSeriesData[0].hasOwnProperty("y")
            ) {
              // Handle multiple series for area chart
              if (seriesKeys.length === 1) {
                // Single series - use standard area chart
                return {
                  type: "area",
                  title: data.title || `Area chart of ${data.y} by ${data.x}`,
                  x_label: data.x || "X",
                  y_label: data.y || "Y",
                  data: firstSeriesData.map((point: any) => ({
                    x:
                      typeof point.x === "string"
                        ? parseFloat(point.x) || point.x
                        : point.x,
                    y:
                      typeof point.y === "string"
                        ? parseFloat(point.y)
                        : point.y,
                    label: `${point.x}: ${point.y}`,
                  })),
                };
              } else {
                // Multiple series - merge data for stacked area chart
                const allXValues = [
                  ...new Set(firstSeriesData.map((point: any) => point.x)),
                ];
                const mergedData = allXValues.map((x) => {
                  const dataPoint: any = { x };
                  seriesKeys.forEach((seriesKey) => {
                    const seriesData = data.data[seriesKey];
                    const point = seriesData.find((p: any) => p.x === x);
                    dataPoint[seriesKey] = point
                      ? typeof point.y === "string"
                        ? parseFloat(point.y)
                        : point.y
                      : 0;
                  });
                  return dataPoint;
                });

                return {
                  type: "area",
                  title: data.title || `Area chart of ${data.y} by ${data.x}`,
                  x_label: data.x || "X",
                  y_label: data.y || "Y",
                  data: mergedData,
                  series: seriesKeys, // Keep track of series names for rendering
                  series_column: data.series_column, // Track the grouping column
                };
              }
            }
          }
        }
        // Handle direct series format from new backend
        else if (data.series && typeof data.series === "object") {
          // New grouped area chart format: {series: {ProductLine1: [{x, y}], ProductLine2: [{x, y}]}}
          const seriesKeys = Object.keys(data.series);

          if (seriesKeys.length > 0) {
            // Get all unique x values across all series
            const allXValues = new Set();
            seriesKeys.forEach((seriesKey) => {
              const seriesData = data.series[seriesKey];
              if (Array.isArray(seriesData)) {
                seriesData.forEach((point: any) => allXValues.add(point.x));
              }
            });

            // Sort x values for proper ordering
            const sortedXValues = Array.from(allXValues).sort();

            // Merge data for stacked area chart
            const mergedData = sortedXValues.map((x) => {
              const dataPoint: any = { x };
              seriesKeys.forEach((seriesKey) => {
                const seriesData = data.series[seriesKey];
                const point = seriesData.find((p: any) => p.x == x); // Use == for flexible comparison
                dataPoint[seriesKey] = point
                  ? typeof point.y === "string"
                    ? parseFloat(point.y)
                    : point.y
                  : 0;
              });
              return dataPoint;
            });

            return {
              type: "area",
              title:
                data.title ||
                `Area chart of ${data.y} by ${data.x}${
                  data.series_column ? ` per ${data.series_column}` : ""
                }`,
              x_label: data.x || "X",
              y_label: data.y || "Y",
              data: mergedData,
              series: seriesKeys, // Keep track of series names for rendering
              series_column: data.series_column, // Track the grouping column
            };
          }
        }
        break;

      default:
        return data;
    }

    return data;
  };

  // Process and detect chart data format
  const processedChartData = useMemo(() => {
    try {
      // If it's already structured chart data, check if it needs processing
      if (
        chartData?.type &&
        (chartData?.data ||
          chartData?.points ||
          chartData?.bins ||
          chartData?.bars ||
          chartData?.slices ||
          chartData?.series ||
          chartData?.x ||
          chartData?.z ||
          chartData?.columns)
      ) {
        // Handle the new formats with different array names
        const dataToProcess = {
          ...chartData,
          data:
            chartData.data ||
            chartData.points ||
            chartData.bins ||
            chartData.bars ||
            chartData.slices ||
            chartData.series,
        };

        // Check if it's an MCP simple chart that needs processing
        if (
          [
            "histogram",
            "line",
            "bar",
            "pie",
            "scatter",
            "area",
            "stacked_bar",
            "heatmap",
            "boxplot",
          ].includes(chartData.type) &&
          (chartData.column ||
            chartData.title ||
            chartData.x ||
            chartData.y ||
            chartData.bars ||
            chartData.z ||
            chartData.columns)
        ) {
          // Removed noisy log
          return processSimpleChartData(dataToProcess);
        }
        // Otherwise return as-is for already processed data
        return dataToProcess;
      }

      // Try to detect your MCP tool's format (create_simple_chart output)
      if (typeof chartData === "string") {
        try {
          const parsed = JSON.parse(chartData);
          if (
            parsed.type &&
            (parsed.data ||
              parsed.points ||
              parsed.bins ||
              parsed.bars ||
              parsed.slices ||
              parsed.series ||
              parsed.x ||
              parsed.z)
          ) {
            // Normalize the data structure
            const normalizedData = {
              ...parsed,
              data:
                parsed.data ||
                parsed.points ||
                parsed.bins ||
                parsed.bars ||
                parsed.slices ||
                parsed.series,
            };
            return processSimpleChartData(normalizedData);
          }
        } catch (e) {
          // Not JSON, continue with other detection
        }
      }

      // Try to detect Plotly format
      if (chartData?.data || Array.isArray(chartData)) {
        // Removed noisy log
        return {
          type: "plotly",
          plotly_data: chartData?.data || chartData,
          plotly_layout: chartData?.layout || {},
        };
      }

      // Try to auto-detect from DataFrame-like structure
      if (typeof chartData === "object" && chartData !== null) {
        // Look for common patterns in the data
        const keys = Object.keys(chartData);

        if (keys.includes("plots") && Array.isArray(chartData.plots)) {
          // Multiple plots - return the first one for now
          return chartData.plots[0];
        }

        // Single chart data
        if (
          keys.includes("x") &&
          keys.includes("y") &&
          !keys.includes("type")
        ) {
          return {
            type: "line",
            data: Array.isArray(chartData.x)
              ? chartData.x.map((x: any, i: number) => ({
                  x,
                  y: chartData.y[i],
                }))
              : [{ x: chartData.x, y: chartData.y }],
            title: chartData.title || "Chart",
          };
        }

        // Direct MCP tool format
        if (
          keys.includes("type") &&
          (keys.includes("data") || keys.includes("x") || keys.includes("z"))
        ) {
          return processSimpleChartData(chartData);
        }
      }

      return null;
    } catch (error) {
      console.error("Error processing chart data:", error);
      return null;
    }
  }, [chartData]);

  // Convert any chart type to Plotly format
  const convertToPlotlyFormat = (chart: ChartData) => {
    // Removed noisy log

    // If already in Plotly format, return as-is
    if (chart.plotly_data && chart.plotly_layout) {
      return {
        plotly_data: chart.plotly_data,
        plotly_layout: chart.plotly_layout,
      };
    }

    // If it's marked as 'plotly' type but missing structure, handle gracefully
    if (chart.type === "plotly") {
      return {
        plotly_data: chart.plotly_data || [],
        plotly_layout: chart.plotly_layout || {},
      };
    }

    // Convert each chart type to Plotly format
    switch (chart.type) {
      case "line":
        return {
          plotly_data: [
            {
              x: chart.data?.map((d: any) => d.x || d.label),
              y: chart.data?.map((d: any) => d.y || d.value),
              type: "scatter",
              mode: "lines+markers",
              name: chart.title || "Line Chart",
              line: { width: 2 },
              marker: { size: 6 },
            },
          ],
          plotly_layout: {
            title: chart.title || "Line Chart",
            xaxis: { title: chart.x_label || "X" },
            yaxis: { title: chart.y_label || "Y" },
          },
        };

      case "bar":
        return {
          plotly_data: [
            {
              x: chart.data?.map((d: any) => d.label || d.x),
              y: chart.data?.map((d: any) => d.value || d.y),
              type: "bar",
              name: chart.title || "Bar Chart",
              marker: {
                color: "rgba(54, 162, 235, 0.8)",
                line: { color: "rgba(54, 162, 235, 1)", width: 1 },
              },
            },
          ],
          plotly_layout: {
            title: chart.title || "Bar Chart",
            xaxis: { title: chart.x_label || "Category" },
            yaxis: { title: chart.y_label || "Value" },
          },
        };

      case "pie":
        return {
          plotly_data: [
            {
              labels: chart.data?.map((d: any) => d.label || d.x),
              values: chart.data?.map((d: any) => d.value || d.y),
              type: "pie",
              name: chart.title || "Pie Chart",
              hole: 0.3, // Make it a donut chart for better appearance
              textinfo: "label+percent",
              textposition: "outside",
            },
          ],
          plotly_layout: {
            title: chart.title || "Pie Chart",
            showlegend: true,
          },
        };

      case "scatter":
        return {
          plotly_data: [
            {
              x: chart.data?.map((d: any) => d.x),
              y: chart.data?.map((d: any) => d.y),
              type: "scatter",
              mode: "markers",
              name: chart.title || "Scatter Plot",
              marker: { size: 8, opacity: 0.7 },
            },
          ],
          plotly_layout: {
            title: chart.title || "Scatter Plot",
            xaxis: { title: chart.x_label || "X" },
            yaxis: { title: chart.y_label || "Y" },
          },
        };

      case "area":
        // Handle both single and multiple series
        if (chart.series && Array.isArray(chart.series)) {
          // Multiple series stacked area chart
          const plotlyData = chart.series.map(
            (seriesName: string, index: number) => ({
              x: chart.data?.map((d: any) => d.x),
              y: chart.data?.map((d: any) => d[seriesName] || 0),
              type: "scatter",
              mode: "lines",
              fill: index === 0 ? "tozeroy" : "tonexty",
              name: seriesName,
              stackgroup: "one",
            })
          );

          return {
            plotly_data: plotlyData,
            plotly_layout: {
              title: chart.title || "Area Chart",
              xaxis: { title: chart.x_label || "X" },
              yaxis: { title: chart.y_label || "Y" },
            },
          };
        } else {
          // Single series area chart
          return {
            plotly_data: [
              {
                x: chart.data?.map((d: any) => d.x),
                y: chart.data?.map((d: any) => d.y || d.value),
                type: "scatter",
                mode: "lines",
                fill: "tozeroy",
                name: chart.title || "Area Chart",
                line: { width: 2 },
              },
            ],
            plotly_layout: {
              title: chart.title || "Area Chart",
              xaxis: { title: chart.x_label || "X" },
              yaxis: { title: chart.y_label || "Y" },
            },
          };
        }

      case "stacked_bar":
        if (chart.y_cols && Array.isArray(chart.y_cols)) {
          const plotlyData = chart.y_cols.map((col: string) => ({
            x: chart.data?.map((d: any) => d.x),
            y: chart.data?.map((d: any) => d[col] || 0),
            type: "bar",
            name: col,
          }));

          return {
            plotly_data: plotlyData,
            plotly_layout: {
              title: chart.title || "Stacked Bar Chart",
              xaxis: { title: chart.x_label || "Category" },
              yaxis: { title: chart.y_label || "Value" },
              barmode: "stack",
            },
          };
        }
        break;

      case "histogram":
        return {
          plotly_data: [
            {
              x: chart.data?.map((d: any) => d.label || d.x),
              y: chart.data?.map((d: any) => d.value || d.y),
              type: "bar",
              name: chart.title || "Histogram",
              marker: {
                color: "rgba(255, 159, 64, 0.8)",
                line: { color: "rgba(255, 159, 64, 1)", width: 1 },
              },
            },
          ],
          plotly_layout: {
            title: chart.title || "Histogram",
            xaxis: { title: chart.x_label || "Value Range" },
            yaxis: { title: chart.y_label || "Frequency" },
          },
        };

      case "heatmap":
        // Convert heatmap to Plotly format
        if (chart.x && chart.y && chart.z) {
          // Analyze the data to detect sparsity and value patterns
          const flatZ = chart.z.flat();
          const nonZeroValues = flatZ.filter(
            (val) => val !== 0 && val !== null && val !== undefined
          );
          const totalValues = flatZ.length;
          const nonZeroCount = nonZeroValues.length;
          const sparsityRatio = nonZeroCount / totalValues;
          const isVerySparse = sparsityRatio < 0.1; // Less than 10% non-zero
          const isSparse = sparsityRatio < 0.3; // Less than 30% non-zero

          // Detect if values are likely counts vs actual values
          const maxValue = Math.max(...flatZ);
          const minNonZero = Math.min(...nonZeroValues.filter((v) => v > 0));
          const avgNonZero =
            nonZeroValues.reduce((sum, val) => sum + val, 0) /
              nonZeroValues.length || 0;

          // Determine if this looks like salary/currency data
          const isCurrencyLike = avgNonZero > 1000 && maxValue > 10000;
          const isCountLike = maxValue <= 100 && Number.isInteger(avgNonZero);

          // Choose appropriate colorscale and configuration based on data characteristics
          let colorscale,
            hovertemplate,
            colorbarTitle,
            annotations = [];

          if (isVerySparse) {
            // For very sparse data, use a colorscale that emphasizes non-zero values
            colorscale = [
              [0, "rgba(255,255,255,0.1)"], // Nearly transparent for zeros
              [0.001, "#440154"], // Dark purple for very small values
              [0.1, "#404387"],
              [0.3, "#2a788e"],
              [0.5, "#22a884"],
              [0.7, "#7ad151"],
              [0.9, "#fde725"],
              [1, "#fde725"],
            ];

            // Add annotation about sparsity
            annotations.push({
              text: `Sparse data: ${(sparsityRatio * 100).toFixed(
                1
              )}% of cells have values`,
              showarrow: false,
              xref: "paper",
              yref: "paper",
              x: 0.02,
              y: 0.98,
              xanchor: "left",
              yanchor: "top",
              bgcolor: "rgba(255,255,255,0.8)",
              bordercolor: "gray",
              borderwidth: 1,
              font: { size: 10 },
            });
          } else if (isSparse) {
            // For moderately sparse data, use a colorscale that shows zeros but emphasizes values
            colorscale = "RdYlBu_r";
          } else {
            // For dense data, use standard colorscale
            colorscale = "Viridis";
          }

          // Set up hover template based on data type
          if (isCurrencyLike) {
            hovertemplate =
              "<b>%{x}</b><br><b>%{y}</b><br>Value: $%{z:,.2f}<extra></extra>";
            colorbarTitle = "Amount ($)";
          } else if (isCountLike) {
            hovertemplate =
              "<b>%{x}</b><br><b>%{y}</b><br>Count: %{z}<extra></extra>";
            colorbarTitle = "Count";
          } else {
            hovertemplate =
              "<b>%{x}</b><br><b>%{y}</b><br>Value: %{z}<extra></extra>";
            colorbarTitle = "Value";
          }

          // Add data interpretation warning if needed
          if (isCountLike && !chart.title?.toLowerCase().includes("count")) {
            annotations.push({
              text: "Note: Values appear to be counts, not aggregated amounts",
              showarrow: false,
              xref: "paper",
              yref: "paper",
              x: 0.02,
              y: 0.02,
              xanchor: "left",
              yanchor: "bottom",
              bgcolor: "rgba(255,235,59,0.8)",
              bordercolor: "orange",
              borderwidth: 1,
              font: { size: 10, color: "black" },
            });
          }

          return {
            plotly_data: [
              {
                z: chart.z,
                x: chart.x,
                y: chart.y,
                type: "heatmap",
                colorscale: colorscale,
                showscale: true,
                hoverongaps: false,
                hovertemplate: hovertemplate,
                colorbar: {
                  title: colorbarTitle,
                  thickness: 20,
                  len: 0.9,
                  tickformat: isCurrencyLike ? "$,.0f" : undefined,
                },
                // For very sparse data, make zero values more transparent
                ...(isVerySparse && {
                  zmin: minNonZero > 0 ? minNonZero * 0.9 : 0,
                  zmid: avgNonZero,
                }),
              },
            ],
            plotly_layout: {
              title: chart.title || "Heatmap",
              xaxis: {
                title: chart.x_label || "X Axis",
                automargin: true,
                side: "bottom",
              },
              yaxis: {
                title: chart.y_label || "Y Axis",
                automargin: true,
              },
              margin: { t: 50, r: 80, b: 50, l: 80 },
              annotations: annotations,
            },
          };
        }
        break;

      case "boxplot":
        // Convert boxplot to Plotly format
        if (chart.columns && chart.data) {
          // Create array of traces, one for each column
          const plotlyData = chart.columns.map((col: string) => {
            // Ensure data for this column exists and is an array
            const columnData = Array.isArray((chart.data as any)[col])
              ? (chart.data as any)[col]
              : [];

            return {
              y: columnData,
              type: "box",
              name: col,
              boxpoints: "outliers",
              jitter: 0.3,
              pointpos: -1.8,
              boxmean: true, // Show mean line
            };
          });

          return {
            plotly_data: plotlyData,
            plotly_layout: {
              title: chart.title || "Box Plot",
              yaxis: { title: chart.y_label || "Values", automargin: true },
              xaxis: { title: chart.x_label || "Categories", automargin: true },
              showlegend: false,
              boxmode: "group",
            },
          };
        }
        break;

      default:
        // If no specific conversion, try to use the data as-is
        return {
          plotly_data: chart.data || [],
          plotly_layout: (chart as any).layout || {},
        };
    }

    // Fallback
    return {
      plotly_data: [],
      plotly_layout: {},
    };
  };

  // Render Plotly chart with enhanced features
  const renderPlotlyChart = (chart: ChartData, isFullscreenMode = false) => {
    try {
      const plotHeight = isFullscreenMode
        ? "calc(100vh - 200px)"
        : `${height}px`;

      // Convert to Plotly format if needed
      const plotlyChart = convertToPlotlyFormat(chart);

      return (
        <Plot
          data={plotlyChart.plotly_data}
          layout={{
            autosize: true,
            margin: { l: 50, r: 50, t: 50, b: 50 },
            paper_bgcolor: "white",
            plot_bgcolor: "white",
            font: {
              family: "Inter, system-ui, sans-serif",
              size: isFullscreenMode ? 14 : 12,
            },
            showlegend: true,
            hovermode: "closest",
            dragmode: panEnabled ? "pan" : "zoom",
            scrollZoom: true,
            doubleClick: "reset+autosize",
            ...plotlyChart.plotly_layout,
          }}
          config={{
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: panEnabled ? [] : ["pan2d"],
            responsive: true,
            toImageButtonOptions: {
              format: "png",
              filename: "chart",
              height: 600,
              width: 800,
              scale: 1,
            },
          }}
          style={{ width: "100%", height: plotHeight }}
          useResizeHandler={true}
          onHover={undefined}
          onRelayout={undefined}
        />
      );
    } catch (error) {
      console.error("Error rendering Plotly chart:", error);
      return (
        <div className="p-4 border border-red-200 bg-red-50 rounded-md">
          <p className="text-red-700 text-sm">
            Error rendering Plotly chart:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      );
    }
  };

  if (!processedChartData) {
    return (
      <div className="p-4 border border-gray-200 bg-gray-50 rounded-md">
        <p className="text-gray-700 text-sm">No chart data available</p>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800"
        >
          {showDebug ? "Hide" : "Show"} Debug Info
        </button>
        {showDebug && (
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
            {JSON.stringify(chartData, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={`smart-chart ${className}`}>
        {processedChartData.title && (
          <h3 className="text-lg font-semibold mb-4 text-center">
            {processedChartData.title}
          </h3>
        )}

        {/* Chart metadata/status */}
        {(processedChartData.sampled ||
          processedChartData.truncated ||
          processedChartData.original_size ||
          processedChartData.showing_categories ||
          processedChartData.aggregated_column) && (
          <div className="mb-2 flex flex-wrap gap-2 justify-center text-xs">
            {processedChartData.sampled && (
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Sampled data used for chart
              </span>
            )}
            {processedChartData.truncated && (
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                Chart truncated to top categories
              </span>
            )}
            {processedChartData.original_size && (
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                Original rows:{" "}
                {processedChartData.original_size.toLocaleString()}
              </span>
            )}
            {processedChartData.showing_categories &&
              processedChartData.total_categories && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Showing {processedChartData.showing_categories} of{" "}
                  {processedChartData.total_categories} categories
                </span>
              )}
            {processedChartData.aggregated_column && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                Aggregated column: <b>{processedChartData.aggregated_column}</b>
              </span>
            )}
          </div>
        )}

        <div
          className={`chart-container relative group ${
            panEnabled ? "" : "cursor-pointer"
          }`}
          onClick={panEnabled ? undefined : () => setIsFullscreen(true)}
          title={
            panEnabled
              ? "Pan mode active - drag on chart area to pan"
              : "Click to view fullscreen"
          }
          ref={chartRef}
        >
          {/* Interactive Controls */}
          <div className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-white bg-opacity-90 border border-gray-200 rounded-lg p-2 shadow-lg">
              <div className="flex flex-col gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomIn();
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomOut();
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetZoom();
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePan();
                  }}
                  className={`p-1 hover:bg-gray-100 rounded ${
                    panEnabled ? "bg-blue-100 text-blue-600" : ""
                  }`}
                  title="Toggle Pan Mode"
                >
                  <Move className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadChart();
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Download Chart"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowControls(!showControls);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Chart Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Fullscreen indicator */}
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-black bg-opacity-50 text-white p-1 rounded">
              <Maximize2 className="w-4 h-4" />
            </div>
          </div>

          {/* Zoom level indicator */}
          {zoomLevel !== 1 && (
            <div className="absolute bottom-2 left-2 z-10 bg-white bg-opacity-90 border border-gray-200 rounded px-2 py-1 text-xs">
              Zoom: {Math.round(zoomLevel * 100)}%
            </div>
          )}

          {/* Pan offset indicator */}
          {(panOffset.x !== 0 || panOffset.y !== 0) && (
            <div className="absolute bottom-2 left-2 z-10 bg-green-100 border border-green-200 rounded px-2 py-1 text-xs text-green-600 mt-8">
              Pan: X{panOffset.x > 0 ? "+" : ""}
              {Math.round(panOffset.x)}, Y{panOffset.y > 0 ? "+" : ""}
              {Math.round(panOffset.y)}
            </div>
          )}

          {/* Pan mode indicator */}
          {panEnabled && (
            <div className="absolute bottom-2 right-2 z-10 bg-blue-100 border border-blue-200 rounded px-2 py-1 text-xs text-blue-600">
              Pan Mode Active - Click & Drag
            </div>
          )}

          {/* Chart rendering area with pan handlers */}
          <div
            className={`chart-render-area ${panEnabled ? "cursor-move" : ""}`}
            onMouseDown={panEnabled ? handlePanStart : undefined}
            onMouseMove={panEnabled ? handlePanMove : undefined}
            onMouseUp={panEnabled ? handlePanEnd : undefined}
            onMouseLeave={panEnabled ? handlePanEnd : undefined}
            style={{ width: "100%", height: "100%" }}
          >
            {renderPlotlyChart(processedChartData)}
          </div>
        </div>

        {/* Advanced Controls Panel */}
        {showControls && (
          <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-sm font-medium mb-3">Chart Controls</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-gray-600 mb-1">Zoom Level</label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">
                  {Math.round(zoomLevel * 100)}%
                </span>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">
                  Interaction Mode
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPanEnabled(false)}
                    className={`px-3 py-1 text-xs rounded ${
                      !panEnabled ? "bg-blue-500 text-white" : "bg-gray-200"
                    }`}
                  >
                    Zoom
                  </button>
                  <button
                    onClick={() => setPanEnabled(true)}
                    className={`px-3 py-1 text-xs rounded ${
                      panEnabled ? "bg-blue-500 text-white" : "bg-gray-200"
                    }`}
                  >
                    Pan
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleResetZoom}
                className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
              >
                Reset View
              </button>
              <button
                onClick={downloadChart}
                className="px-3 py-1 text-xs bg-green-500 text-white hover:bg-green-600 rounded"
              >
                Export Chart
              </button>
            </div>
          </div>
        )}

        {/* Debug toggle */}
        <div className="mt-2 flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDebug(!showDebug);
            }}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Debug
          </button>
        </div>

        {showDebug && (
          <details className="mt-2">
            <summary className="text-xs text-gray-600 cursor-pointer">
              Chart Data
            </summary>
            <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
              {JSON.stringify(processedChartData, null, 2)}
            </pre>
          </details>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="w-full h-full max-w-7xl max-h-full p-8 flex flex-col">
            {/* Header with controls */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">
                {processedChartData.title || "Chart"}
              </h2>
              <div className="flex items-center gap-4">
                {/* Fullscreen controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZoomIn();
                    }}
                    className="text-white hover:text-gray-300 p-2"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZoomOut();
                    }}
                    className="text-white hover:text-gray-300 p-2"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResetZoom();
                    }}
                    className="text-white hover:text-gray-300 p-2"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePan();
                    }}
                    className={`p-2 ${
                      panEnabled
                        ? "text-blue-400"
                        : "text-white hover:text-gray-300"
                    }`}
                    title="Toggle Pan Mode"
                  >
                    <Move className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadChart();
                    }}
                    className="text-white hover:text-gray-300 p-2"
                    title="Download Chart"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="text-white hover:text-gray-300 p-2"
                  title="Close fullscreen"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Status indicators */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex gap-4 text-sm text-white">
                {zoomLevel !== 1 && (
                  <span className="bg-white bg-opacity-20 px-2 py-1 rounded">
                    Zoom: {Math.round(zoomLevel * 100)}%
                  </span>
                )}
                {panEnabled && (
                  <span className="bg-blue-500 bg-opacity-50 px-2 py-1 rounded">
                    Pan Mode Active
                  </span>
                )}
              </div>
            </div>

            {/* Fullscreen Chart */}
            <div className="flex-1 bg-white rounded-lg p-4">
              <div
                className={`chart-render-area-fullscreen ${
                  panEnabled ? "cursor-move" : ""
                }`}
                onMouseDown={panEnabled ? handlePanStart : undefined}
                onMouseMove={panEnabled ? handlePanMove : undefined}
                onMouseUp={panEnabled ? handlePanEnd : undefined}
                onMouseLeave={panEnabled ? handlePanEnd : undefined}
                style={{ width: "100%", height: "100%" }}
              >
                {renderPlotlyChart(processedChartData, true)}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
