// Test script to verify box plot detection in parseChartData
import { parseChartData } from './src/lib/utils.js'

// Test box plot data similar to what would come from the backend
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
`

const testHeatmapResponse = `
Here is your heatmap:

\`\`\`json
{
  "type": "heatmap",
  "data": {
    "z": [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
    "x": ["A", "B", "C"],
    "y": ["X", "Y", "Z"]
  },
  "title": "Sample Heatmap"
}
\`\`\`

The heatmap shows correlation between variables.
`

const testStackedBarResponse = `
Here is your stacked bar chart:

\`\`\`json
{
  "type": "stacked_bar",
  "data": [
    {"category": "A", "value1": 10, "value2": 20},
    {"category": "B", "value1": 15, "value2": 25}
  ]
}
\`\`\`

The stacked bar chart shows multiple values per category.
`

console.log("Testing box plot detection:")
const boxPlotResult = parseChartData(testBoxPlotResponse)
console.log("Box plot - hasChart:", boxPlotResult.hasChart)
console.log("Box plot - chartType:", boxPlotResult.chartType)
console.log("Box plot - chartData:", JSON.stringify(boxPlotResult.chartData, null, 2))
console.log()

console.log("Testing heatmap detection:")
const heatmapResult = parseChartData(testHeatmapResponse)
console.log("Heatmap - hasChart:", heatmapResult.hasChart)
console.log("Heatmap - chartType:", heatmapResult.chartType)
console.log("Heatmap - chartData:", JSON.stringify(heatmapResult.chartData, null, 2))
console.log()

console.log("Testing stacked bar detection:")
const stackedBarResult = parseChartData(testStackedBarResponse)
console.log("Stacked bar - hasChart:", stackedBarResult.hasChart)
console.log("Stacked bar - chartType:", stackedBarResult.chartType)
console.log("Stacked bar - chartData:", JSON.stringify(stackedBarResult.chartData, null, 2))
