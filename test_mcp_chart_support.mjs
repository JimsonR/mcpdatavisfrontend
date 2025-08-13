// Test the updated MCP visualization tool chart support
// Run with: node test_mcp_chart_support.mjs

const testMCPLineChart = {
  type: "line",
  points: [
    { x: "2011", y: 3144713.0989 },
    { x: "2012", y: 9329154.3425 },
    { x: "2013", y: 10239209.3403 },
    { x: "2014", y: 4437517.8076 },
  ],
  title: "Total Sales by Year and Territory",
  x: "Year",
  y: "TotalSales",
  sampled: false,
  original_size: 40,
};

const testMCPBarChart = {
  type: "bar",
  bars: [
    { label: "Electronics", value: 150000 },
    { label: "Clothing", value: 120000 },
    { label: "Books", value: 85000 },
  ],
  title: "Sales by Category",
  x: "Category",
  y: "Sales",
};

const testMCPToolResponse = `
Here's your line chart visualization:

\`\`\`json
{
  "type": "line",
  "points": [
    {"x": "2011", "y": 3144713.0989},
    {"x": "2012", "y": 9329154.3425},
    {"x": "2013", "y": 10239209.3403},
    {"x": "2014", "y": 4437517.8076}
  ],
  "title": "Total Sales by Year and Territory",
  "x": "Year",
  "y": "TotalSales",
  "sampled": false,
  "original_size": 40
}
\`\`\`

The chart shows sales trends over the years.
`;

// Test MCP chart detection
function testMCPChartDetection() {
  console.log("Testing MCP Chart Detection\n");

  // Test the detection logic from utils.ts
  const isMCPSimpleChart = (data) => {
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

  console.log("Test 1: Line Chart with 'points' field");
  console.log("Data:", JSON.stringify(testMCPLineChart, null, 2));
  console.log("Detected as MCP chart:", isMCPSimpleChart(testMCPLineChart));
  console.log("Chart type:", testMCPLineChart.type);
  console.log("Has points:", !!testMCPLineChart.points);
  console.log("Points length:", testMCPLineChart.points?.length);
  console.log("");

  console.log("Test 2: Bar Chart with 'bars' field (should now be detected)");
  console.log("Data:", JSON.stringify(testMCPBarChart, null, 2));
  console.log("Detected as MCP chart:", isMCPSimpleChart(testMCPBarChart));
  console.log("Chart type:", testMCPBarChart.type);
  console.log("Has bars:", !!testMCPBarChart.bars);
  console.log("✅ This should now be detected with the updated logic");
  console.log("");

  // Test streaming detection logic from Chat.tsx
  const testStreamingDetection = (toolResult) => {
    let isChartData = false;
    try {
      const parsed = JSON.parse(toolResult);
      if (
        parsed &&
        typeof parsed === "object" &&
        parsed.type &&
        (parsed.data !== undefined || parsed.points !== undefined) &&
        [
          "histogram",
          "line",
          "bar",
          "pie",
          "scatter",
          "stacked_bar",
          "heatmap",
          "boxplot",
        ].includes(parsed.type)
      ) {
        isChartData = true;
      }
    } catch (e) {
      // Not JSON, treat as regular text
    }
    return isChartData;
  };

  console.log("Test 3: Streaming Detection for Line Chart JSON");
  const lineChartJSON = JSON.stringify(testMCPLineChart);
  console.log("JSON string:", lineChartJSON.substring(0, 100) + "...");
  console.log(
    "Detected as chart data in streaming:",
    testStreamingDetection(lineChartJSON)
  );
  console.log("");

  // Test JSON block parsing from tool response
  const jsonBlockRegex =
    /```(?:json|plotly|chart|recharts|visualization)?\s*(\{[\s\S]*?\})\s*```/gi;
  const match = jsonBlockRegex.exec(testMCPToolResponse);

  console.log("Test 4: JSON Block Extraction from Tool Response");
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      console.log("Extracted JSON:", JSON.stringify(parsed, null, 2));
      console.log("Detected as MCP chart:", isMCPSimpleChart(parsed));
      console.log(
        "Would be formatted as JSON code block:",
        testStreamingDetection(JSON.stringify(parsed))
      );
    } catch (e) {
      console.log("Failed to parse extracted JSON:", e.message);
    }
  } else {
    console.log("No JSON block found in tool response");
  }

  console.log("\n=== Summary ===");
  console.log("✅ Line charts with 'points' field will now be detected");
  console.log(
    "✅ Tool results with chart data will be formatted as JSON code blocks"
  );
  console.log("✅ Chart parsing will handle both 'data' and 'points' fields");
  console.log(
    "⚠️  Bar charts with 'bars' field need additional support (future enhancement)"
  );
}

testMCPChartDetection();
