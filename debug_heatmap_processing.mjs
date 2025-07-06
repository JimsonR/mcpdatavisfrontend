// Test the full heatmap processing pipeline
// This simulates what happens in SmartChart when processing heatmap data

const heatmapData = {
  "type": "heatmap",
  "title": "Correlation Matrix",
  "x": ["A", "B", "C", "D"],
  "y": ["1", "2", "3"],
  "z": [[0.1, 0.5, 0.9, 0.2], [0.3, 0.8, 0.1, 0.6], [0.7, 0.2, 0.4, 0.9]],
  "data": []
};

// Simulate processSimpleChartData for heatmap
function processHeatmapData(data) {
  switch (data.type) {
    case 'heatmap':
      if (data.x && data.y && data.z) {
        return {
          type: 'plotly',
          plotly_data: [{
            z: data.z,
            x: data.x,
            y: data.y,
            type: 'heatmap',
            colorscale: 'Viridis',
            showscale: true
          }],
          plotly_layout: {
            title: data.title || 'Heatmap',
            xaxis: { title: 'X Axis' },
            yaxis: { title: 'Y Axis' }
          }
        }
      }
      break;
    default:
      return null;
  }
}

console.log("Original heatmap data:");
console.log(JSON.stringify(heatmapData, null, 2));

console.log("\nProcessed heatmap data:");
const processedData = processHeatmapData(heatmapData);
console.log(JSON.stringify(processedData, null, 2));

console.log("\nProcessing summary:");
console.log("- Original type:", heatmapData.type);
console.log("- Processed type:", processedData?.type);
console.log("- Has plotly_data:", !!processedData?.plotly_data);
console.log("- Has plotly_layout:", !!processedData?.plotly_layout);
console.log("- Plotly data type:", processedData?.plotly_data?.[0]?.type);

// Test decision logic
const preferRecharts = false; // This would be false for heatmaps from ToolExecution
const shouldUsePlotly = processedData?.type === 'plotly' || !preferRecharts;
console.log("- preferRecharts:", preferRecharts);
console.log("- Should use Plotly:", shouldUsePlotly);
