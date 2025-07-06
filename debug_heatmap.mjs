// Debug test for heatmap chart parsing
// Run with: node debug_heatmap.mjs

const heatmapToolResponse = `
Here's your heatmap visualization:

\`\`\`json
{
  "type": "heatmap",
  "title": "Correlation Matrix",
  "x": ["A", "B", "C", "D"],
  "y": ["1", "2", "3"],
  "z": [[0.1, 0.5, 0.9, 0.2], [0.3, 0.8, 0.1, 0.6], [0.7, 0.2, 0.4, 0.9]],
  "data": []
}
\`\`\`

This heatmap shows the correlation between variables.
`;

// Simulate the parseChartData function logic
function isMCPSimpleChart(data) {
  return data && typeof data === 'object' && 
         data.type && data.data !== undefined && 
         ['histogram', 'line', 'bar', 'pie', 'scatter', 'stacked_bar', 'heatmap', 'boxplot'].includes(data.type) &&
         (Array.isArray(data.data) || typeof data.data === 'object')
}

function parseChartData(content) {
  try {
    const jsonBlockRegex = /```(?:json|plotly|chart|recharts|visualization)?\s*(\{[\s\S]*?\})\s*```/gi;
    
    let match;
    let chartData = null;
    let chartType = 'unknown';
    
    while ((match = jsonBlockRegex.exec(content)) !== null) {
      try {
        const jsonStr = match[1];
        const parsed = JSON.parse(jsonStr);
        
        if (isMCPSimpleChart(parsed)) {
          chartData = parsed;
          // Route heatmap and boxplot to Plotly, others to Recharts
          chartType = (parsed.type === 'heatmap' || parsed.type === 'boxplot') ? 'plotly' : 'recharts';
          break;
        }
      } catch (e) {
        // Not valid JSON, continue
      }
    }
    
    return {
      hasChart: !!chartData,
      chartData,
      chartType
    };
  } catch (error) {
    console.error('Error parsing chart data:', error);
    return {
      hasChart: false,
      chartType: 'unknown'
    };
  }
}

// Test the parsing
console.log("Testing heatmap tool response parsing:");
const result = parseChartData(heatmapToolResponse);
console.log("Result:", JSON.stringify(result, null, 2));

console.log("\nChart detection:");
console.log("- hasChart:", result.hasChart);
console.log("- chartType:", result.chartType);
console.log("- preferRecharts would be:", result.chartType === 'recharts');

if (result.hasChart && result.chartData) {
  console.log("\nChart data details:");
  console.log("- type:", result.chartData.type);
  console.log("- has x:", !!result.chartData.x);
  console.log("- has y:", !!result.chartData.y);
  console.log("- has z:", !!result.chartData.z);
  console.log("- z dimensions:", result.chartData.z ? result.chartData.z.length + " x " + result.chartData.z[0].length : "N/A");
}
