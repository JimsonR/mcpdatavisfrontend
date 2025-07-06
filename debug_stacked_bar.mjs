// Debug test for stacked bar chart parsing

const stackedBarToolResponse = `
Here's your stacked bar chart:

\`\`\`json
{
  "type": "stacked_bar",
  "title": "Sales by Category and Quarter",
  "x": "category",
  "y_cols": ["Q1", "Q2", "Q3", "Q4"],
  "data": [
    {"category": "Electronics", "Q1": 100, "Q2": 120, "Q3": 110, "Q4": 130},
    {"category": "Clothing", "Q1": 80, "Q2": 90, "Q3": 85, "Q4": 95},
    {"category": "Books", "Q1": 40, "Q2": 45, "Q3": 50, "Q4": 55}
  ]
}
\`\`\`

This shows quarterly sales performance.
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
console.log("Testing stacked bar tool response parsing:");
const result = parseChartData(stackedBarToolResponse);
console.log("Result:", JSON.stringify(result, null, 2));

console.log("\nChart detection:");
console.log("- hasChart:", result.hasChart);
console.log("- chartType:", result.chartType);
console.log("- preferRecharts would be:", result.chartType === 'recharts');

if (result.hasChart && result.chartData) {
  console.log("\nChart data details:");
  console.log("- type:", result.chartData.type);
  console.log("- has x:", !!result.chartData.x);
  console.log("- has y_cols:", !!result.chartData.y_cols);
  console.log("- y_cols:", result.chartData.y_cols);
  console.log("- data length:", result.chartData.data.length);
}
