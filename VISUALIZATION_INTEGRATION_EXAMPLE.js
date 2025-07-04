// Example of how your create_visualization tool output works with SmartChart

// Your tool returns this format:
const exampleToolOutput = `{
  "type": "histogram",
  "data": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  "title": "Sample Histogram",
  "column": "values",
  "bins": 5
}`

// SmartChart processes it like this:
// 1. Detects it's a string
// 2. JSON.parse() converts it to object
// 3. processSimpleChartData() handles the visualization
// 4. Renders as appropriate chart type

// Example usage in Chat component:
const chatMessage = {
  type: 'tool_result',
  content: [
    {
      type: 'text',
      text: exampleToolOutput
    }
  ]
}

// SmartChart will automatically detect and render this!
