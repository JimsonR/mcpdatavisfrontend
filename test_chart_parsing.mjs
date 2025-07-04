// Test the parseChartData function directly
import { parseChartData } from './src/lib/utils.js';

console.log('Testing Chart Data Detection for MCP Tools\n');

// Test 1: Histogram data (like from your create_simple_chart tool)
const histogramResponse = `{
  "type": "histogram",
  "data": [100, 200, 150, 300, 250, 180, 220, 190, 280, 160],
  "title": "Distribution of SALES",
  "column": "SALES"
}`;

console.log('Test 1: Histogram Detection');
console.log('Input:', histogramResponse);
const histResult = parseChartData(histogramResponse);
console.log('Output:', histResult);
console.log('Has Chart:', histResult.hasChart);
console.log('Chart Type:', histResult.chartType);
console.log('Chart Data Type:', histResult.chartData?.type);
console.log('---\n');

// Test 2: Line data with dates
const lineResponse = `{
  "type": "line",
  "data": ["2/24/2003 0:00", "5/7/2003 0:00", "7/1/2003 0:00"],
  "title": "ORDERDATE Over Time",
  "column": "ORDERDATE"
}`;

console.log('Test 2: Line Chart Detection');
console.log('Input:', lineResponse);
const lineResult = parseChartData(lineResponse);
console.log('Output:', lineResult);
console.log('Has Chart:', lineResult.hasChart);
console.log('Chart Type:', lineResult.chartType);
console.log('Chart Data Type:', lineResult.chartData?.type);
console.log('---\n');

// Test 3: Mixed content (like a tool response with other text)
const mixedResponse = `Tool executed successfully.

Result:
{
  "type": "histogram",
  "data": [100, 200, 150],
  "title": "Sales Distribution",
  "column": "SALES"
}

Analysis complete.`;

console.log('Test 3: Mixed Content Detection');
console.log('Input:', mixedResponse);
const mixedResult = parseChartData(mixedResponse);
console.log('Output:', mixedResult);
console.log('Has Chart:', mixedResult.hasChart);
console.log('Chart Type:', mixedResult.chartType);
console.log('Clean Text:', mixedResult.textContent);
console.log('---\n');

console.log('Chart detection testing complete!');
