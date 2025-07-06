// Simple test for parseChartData function
const fs = require('fs');

// Read the compiled utils from dist if available, or create a simple test
const testBoxPlotResponse = `
Here is your box plot:

\`\`\`json
{
  "type": "boxplot",
  "data": {
    "y": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "name": "Sample Data"
  },
  "title": "Sample Box Plot"
}
\`\`\`

The box plot shows the distribution of the data.
`;

// Simple regex test to see if our pattern would match
const jsonBlockRegex = /```(?:json|JSON)\s*\n([\s\S]*?)\n```/g;
const match = jsonBlockRegex.exec(testBoxPlotResponse);

if (match) {
  console.log("Found JSON block:");
  try {
    const parsed = JSON.parse(match[1]);
    console.log("Parsed data:", JSON.stringify(parsed, null, 2));
    console.log("Type:", parsed.type);
    console.log("Has data:", !!parsed.data);
    
    // Test if it would be detected as MCP chart
    const supportedTypes = ['histogram', 'line', 'bar', 'pie', 'scatter', 'stacked_bar', 'heatmap', 'boxplot'];
    const isMCPChart = parsed && typeof parsed === 'object' && 
                      parsed.type && parsed.data && 
                      supportedTypes.includes(parsed.type) &&
                      (Array.isArray(parsed.data) || typeof parsed.data === 'object');
    
    console.log("Would be detected as MCP chart:", isMCPChart);
    
    // Test chart type routing
    const chartType = (parsed.type === 'heatmap' || parsed.type === 'boxplot') ? 'plotly' : 'recharts';
    console.log("Would be routed to:", chartType);
    
  } catch (e) {
    console.log("Failed to parse JSON:", e.message);
  }
} else {
  console.log("No JSON block found");
}
