// Test all new chart types
const testHeatmapResponse = `
\`\`\`json
{
  "type": "heatmap",
  "data": {
    "z": [[1, 2, 3], [4, 5, 6]],
    "x": ["A", "B", "C"],
    "y": ["X", "Y"]
  }
}
\`\`\`
`;

const testStackedBarResponse = `
\`\`\`json
{
  "type": "stacked_bar",
  "data": [
    {"category": "A", "value1": 10, "value2": 20}
  ]
}
\`\`\`
`;

function testChartDetection(response, chartName) {
  const jsonBlockRegex = /```(?:json|JSON)\s*\n([\s\S]*?)\n```/g;
  const match = jsonBlockRegex.exec(response);
  
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      const supportedTypes = ['histogram', 'line', 'bar', 'pie', 'scatter', 'stacked_bar', 'heatmap', 'boxplot'];
      const isMCPChart = parsed && typeof parsed === 'object' && 
                        parsed.type && parsed.data && 
                        supportedTypes.includes(parsed.type) &&
                        (Array.isArray(parsed.data) || typeof parsed.data === 'object');
      
      const chartType = (parsed.type === 'heatmap' || parsed.type === 'boxplot') ? 'plotly' : 'recharts';
      
      console.log(`${chartName}:`);
      console.log(`  - Type: ${parsed.type}`);
      console.log(`  - Would be detected: ${isMCPChart}`);
      console.log(`  - Would be routed to: ${chartType}`);
      console.log();
      
    } catch (e) {
      console.log(`${chartName}: Failed to parse - ${e.message}`);
    }
  } else {
    console.log(`${chartName}: No JSON block found`);
  }
}

testChartDetection(testHeatmapResponse, "Heatmap");
testChartDetection(testStackedBarResponse, "Stacked Bar");
