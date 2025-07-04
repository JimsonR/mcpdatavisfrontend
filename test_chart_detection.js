// Test script to verify chart data detection and rendering
// This simulates the output from your create_simple_chart MCP tool

console.log('Testing Chart Data Detection\n');

const testChartData = {
  "type": "line",
  "data": [
    "2/24/2003 0:00",
    "5/7/2003 0:00", 
    "7/1/2003 0:00",
    "8/25/2003 0:00",
    "10/10/2003 0:00",
    "10/28/2003 0:00",
    "11/11/2003 0:00",
    "11/18/2003 0:00",
    "12/1/2003 0:00"
  ],
  "title": "ORDERDATE Over Time",
  "column": "ORDERDATE"
};

console.log('Chart Data Object:');
console.log(JSON.stringify(testChartData, null, 2));

console.log('\nChart Data as JSON String (how MCP tool returns it):');
console.log(JSON.stringify(testChartData));

// Test histogram data
const histogramData = {
  "type": "histogram",
  "data": [100, 200, 150, 300, 250, 180, 220, 190, 280, 160],
  "title": "Distribution of SALES",
  "column": "SALES"
};

console.log('\n\nHistogram Data:');
console.log(JSON.stringify(histogramData, null, 2));

console.log('\nCopy these JSON strings to test in the frontend chart detection!');
