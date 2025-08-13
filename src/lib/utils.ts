import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function parseChartData(content: string): {
  hasChart: boolean;
  chartData?: any;
  textContent: string;
  chartType?: "plotly" | "recharts" | "unknown";
} {
  try {
    // Enhanced regex patterns for different chart formats
    const jsonBlockRegex =
      /```(?:json|plotly|chart|recharts|visualization)?\s*(\{[\s\S]*?\})\s*```/gi;
    const pythonOutputRegex = /```(?:output|result)?\s*(\{[\s\S]*?\})\s*```/gi;
    const codeBlockRegex = /```python[\s\S]*?```/gi;

    let match;
    let chartData = null;
    let chartType: "plotly" | "recharts" | "unknown" = "unknown";
    let cleanContent = content;

    // Remove Python code blocks first
    cleanContent = cleanContent.replace(codeBlockRegex, "");

    // Function to validate if JSON is MCP simple chart data
    const isMCPSimpleChart = (data: any): boolean => {
      if (!data || typeof data !== "object" || !data.type) return false;
      if (
        ![
          "histogram",
          "line",
          "bar",
          "pie",
          "scatter",
          "stacked_bar",
          "heatmap",
          "boxplot",
        ].includes(data.type)
      )
        return false;

      // Check for various data field names used by MCP tools
      return !!(
        (
          data.data !== undefined ||
          data.points !== undefined ||
          data.bars !== undefined ||
          data.slices !== undefined ||
          data.bins !== undefined ||
          (data.x !== undefined && data.y !== undefined) ||
          data.z !== undefined
        ) // for heatmaps
      );
    };

    // Function to validate if JSON is Recharts data
    const isRechartsData = (data: any): boolean => {
      if (
        data.type &&
        ["line", "bar", "pie", "scatter", "area", "stacked_bar"].includes(
          data.type
        )
      ) {
        return true;
      }
      if (data.plots && Array.isArray(data.plots)) {
        return data.plots.some(
          (plot: any) =>
            plot.type &&
            ["line", "bar", "pie", "scatter", "area", "stacked_bar"].includes(
              plot.type
            )
        );
      }
      return false;
    };

    // Function to validate if JSON is Plotly chart data
    const isPlotlyData = (data: any): boolean => {
      // Standard Plotly format: {data: [...], layout: {...}}
      if (data.data && Array.isArray(data.data)) return true;

      // Direct data array format: [{x: [...], y: [...], type: 'scatter'}]
      if (Array.isArray(data) && data.length > 0) {
        const firstItem = data[0];
        return (
          firstItem &&
          (firstItem.type || firstItem.x || firstItem.y || firstItem.z)
        );
      }

      // Single trace format: {x: [...], y: [...], type: 'scatter'}
      if (data.type || (data.x && data.y)) return true;

      // Figure object format (from pandas/plotly)
      if (data.data && data.layout) return true;

      // DataFrame.plot() or similar output
      if (data.traces || data.figure) return true;

      return false;
    };

    // Look for JSON chart data in code blocks
    const allPatterns = [jsonBlockRegex, pythonOutputRegex];
    for (const pattern of allPatterns) {
      pattern.lastIndex = 0; // Reset regex state
      while ((match = pattern.exec(content)) !== null) {
        try {
          const jsonStr = match[1];
          const parsed = JSON.parse(jsonStr);

          // Check for MCP simple chart format first
          if (isMCPSimpleChart(parsed)) {
            chartData = parsed;
            // All chart types now use Plotly rendering
            chartType = "plotly";
            cleanContent = cleanContent.replace(match[0], "");
            break;
          }
          // Check for Recharts format
          else if (isRechartsData(parsed)) {
            chartData = parsed;
            // All chart types now use Plotly rendering
            chartType = "plotly";
            cleanContent = cleanContent.replace(match[0], "");
            break;
          }
          // Then check for Plotly format
          else if (isPlotlyData(parsed)) {
            chartData = parsed;
            chartType = "plotly";
            cleanContent = cleanContent.replace(match[0], "");
            break;
          }
        } catch (e) {
          // Not valid JSON or not chart data, continue
        }
      }
      if (chartData) break;
    }

    // Also check for inline JSON that might be chart data
    if (!chartData) {
      // First, try to parse the entire content as JSON (for direct tool responses)
      try {
        const entireContentParsed = JSON.parse(content.trim());
        if (isMCPSimpleChart(entireContentParsed)) {
          chartData = entireContentParsed;
          // All chart types now use Plotly rendering
          chartType = "plotly";
          cleanContent = ""; // Clear content since it's just chart data
        } else if (isRechartsData(entireContentParsed)) {
          chartData = entireContentParsed;
          // All chart types now use Plotly rendering
          chartType = "plotly";
          cleanContent = "";
        } else if (isPlotlyData(entireContentParsed)) {
          chartData = entireContentParsed;
          chartType = "plotly";
          cleanContent = "";
        }
      } catch (e) {
        // Not pure JSON, continue with line-by-line detection
      }
    }

    // Check line by line for JSON
    if (!chartData) {
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
          try {
            const parsed = JSON.parse(trimmed);
            if (isMCPSimpleChart(parsed)) {
              chartData = parsed;
              // All chart types now use Plotly rendering
              chartType = "plotly";
              cleanContent = cleanContent.replace(line, "");
              break;
            } else if (isRechartsData(parsed)) {
              chartData = parsed;
              // All chart types now use Plotly rendering
              chartType = "plotly";
              cleanContent = cleanContent.replace(line, "");
              break;
            } else if (isPlotlyData(parsed)) {
              chartData = parsed;
              chartType = "plotly";
              cleanContent = cleanContent.replace(line, "");
              break;
            }
          } catch (e) {
            // Not valid JSON, continue
          }
        }
      }
    }

    // Special handling for DataFrame-generated charts
    if (!chartData) {
      // Look for patterns like "Chart data:" or "Visualization:" followed by JSON
      const dataMarkerRegex =
        /(?:Chart data|Visualization|Plot data|Figure):\s*(\{[\s\S]*?\})/gi;
      while ((match = dataMarkerRegex.exec(content)) !== null) {
        try {
          const parsed = JSON.parse(match[1]);
          if (isMCPSimpleChart(parsed)) {
            chartData = parsed;
            // All chart types now use Plotly rendering
            chartType = "plotly";
            cleanContent = cleanContent.replace(match[0], "");
            break;
          } else if (isRechartsData(parsed)) {
            chartData = parsed;
            // All chart types now use Plotly rendering
            chartType = "plotly";
            cleanContent = cleanContent.replace(match[0], "");
            break;
          } else if (isPlotlyData(parsed)) {
            chartData = parsed;
            chartType = "plotly";
            cleanContent = cleanContent.replace(match[0], "");
            break;
          }
        } catch (e) {
          // Continue searching
        }
      }
    }

    return {
      hasChart: !!chartData,
      chartData,
      textContent: cleanContent.trim(),
      chartType,
    };
  } catch (error) {
    console.error("Error parsing chart data:", error);
    return {
      hasChart: false,
      textContent: content,
      chartType: "unknown",
    };
  }
}

export function parseResponseWithInlineCharts(
  responseText: string,
  toolExecutions: any[]
): {
  segments: Array<{
    type: "text" | "chart";
    content: string;
    chartData?: any;
    chartType?: "plotly" | "recharts" | "unknown";
  }>;
  toolExecutionCharts: Array<{
    data: any;
    type: "plotly" | "recharts" | "unknown";
    executionIndex: number;
  }>;
} {
  // Extract chart data from tool executions
  const toolExecutionCharts: Array<{
    data: any;
    type: "plotly" | "recharts" | "unknown";
    executionIndex: number;
  }> = [];

  toolExecutions.forEach((execution, index) => {
    if (execution.tool_response) {
      const toolResponse = parseChartData(execution.tool_response);
      if (toolResponse.hasChart) {
        toolExecutionCharts.push({
          data: toolResponse.chartData,
          type: toolResponse.chartType || "unknown",
          executionIndex: index,
        });
      }
    }
  });

  // Return just the text content as a single segment
  // No longer try to embed charts within text descriptions
  const segments: Array<{
    type: "text" | "chart";
    content: string;
    chartData?: any;
    chartType?: "plotly" | "recharts" | "unknown";
  }> = [];

  // Simply return the entire response text as one text segment
  segments.push({
    type: "text",
    content: responseText,
  });

  return {
    segments,
    toolExecutionCharts,
  };
}
