// Test script to check chart parsing and rendering
const testHeatmapResponse = `
Here's your heatmap visualization:

\`\`\`json
{
  "type": "heatmap",
  "title": "Test Heatmap",
  "x": ["A", "B", "C"],
  "y": ["1", "2", "3"],
  "z": [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
  "data": []
}
\`\`\`

This shows the correlation matrix.
`;

const testStackedBarResponse = `
Here's your stacked bar chart:

\`\`\`json
{
  "type": "stacked_bar",
  "title": "Test Stacked Bar",
  "x": "category",
  "y_cols": ["series1", "series2"],
  "data": [
    {"category": "A", "series1": 10, "series2": 20},
    {"category": "B", "series1": 15, "series2": 25},
    {"category": "C", "series1": 12, "series2": 18}
  ]
}
\`\`\`

This shows the stacked values.
`;

// Import the parseChartData function (this won't actually work in a test file but shows the logic)
// const { parseChartData } = require('../lib/utils');

console.log("Testing heatmap parsing:");
// console.log(parseChartData(testHeatmapResponse));

console.log("\nTesting stacked bar parsing:");
// console.log(parseChartData(testStackedBarResponse));

// Export for potential use
export { testHeatmapResponse, testStackedBarResponse };

