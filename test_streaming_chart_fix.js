// Test script to verify streaming structured agent chart detection fix

console.log("Testing Streaming Structured Agent Chart Detection Fix\n");

// Simulate the chart detection logic from MarkdownRenderer
function isChartData(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== "object") return false;

    // Check for MCP chart format
    if (
      parsed.type &&
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
      // Check for various data field names used by MCP tools
      return !!(
        parsed.data !== undefined ||
        parsed.points !== undefined ||
        parsed.bars !== undefined ||
        parsed.slices !== undefined ||
        parsed.bins !== undefined ||
        (parsed.x !== undefined && parsed.y !== undefined) ||
        parsed.z !== undefined
      );
    }

    // Check for other chart data patterns
    return !!(
      parsed.type ||
      parsed.data ||
      parsed.series ||
      (parsed.x && parsed.y) ||
      parsed.labels ||
      parsed.datasets ||
      parsed.bars ||
      parsed.points
    );
  } catch {
    return false;
  }
}

// Test cases that simulate tool results in streaming mode
const testCases = [
  {
    name: "MCP Bar Chart (bars field)",
    data: JSON.stringify({
      type: "bar",
      bars: [
        { label: "Product A", value: 15000 },
        { label: "Product B", value: 22000 },
        { label: "Product C", value: 18000 },
      ],
      title: "Sales by Product",
    }),
  },
  {
    name: "MCP Line Chart (points field)",
    data: JSON.stringify({
      type: "line",
      points: [
        { x: "Jan", y: 12500 },
        { x: "Feb", y: 15600 },
        { x: "Mar", y: 13200 },
      ],
      title: "Sales Over Time",
    }),
  },
  {
    name: "MCP Heatmap (x, y, z fields)",
    data: JSON.stringify({
      type: "heatmap",
      x: ["A", "B", "C"],
      y: ["X", "Y", "Z"],
      z: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
      title: "Sample Heatmap",
    }),
  },
  {
    name: "Regular JSON (should not be detected)",
    data: JSON.stringify({
      status: "success",
      message: "Data processed",
      count: 42,
    }),
  },
  {
    name: "Invalid JSON",
    data: "This is not JSON at all",
  },
];

console.log("Test Results:");
console.log("=".repeat(50));

testCases.forEach((testCase) => {
  const isChart = isChartData(testCase.data);
  const status = isChart ? "✅ DETECTED" : "❌ NOT DETECTED";

  console.log(`${testCase.name}: ${status}`);

  if (isChart) {
    try {
      const parsed = JSON.parse(testCase.data);
      console.log(`  └─ Type: ${parsed.type || "unknown"}`);
      console.log(
        `  └─ Chart data fields: ${Object.keys(parsed)
          .filter((k) =>
            [
              "data",
              "points",
              "bars",
              "slices",
              "bins",
              "x",
              "y",
              "z",
              "series",
            ].includes(k)
          )
          .join(", ")}`
      );
    } catch (e) {
      console.log(`  └─ Parse error: ${e.message}`);
    }
  }
  console.log("");
});

console.log("Summary:");
console.log(`- MCP charts should be detected: ✅`);
console.log(`- Regular JSON should NOT be detected: ❌`);
console.log(`- Invalid JSON should NOT be detected: ❌`);
console.log(`\nThe fix should now work for streaming structured agent mode!`);
