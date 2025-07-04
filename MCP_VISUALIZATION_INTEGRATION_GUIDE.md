# MCP Tool Integration: create_visualization

## Updated Tool Behavior

Your `create_visualization` tool now returns chart data as JSON text, which integrates perfectly with the SmartChart component.

## Tool Output Format

```python
@mcp.tool()
def create_visualization(args: CreateVisualizationArgs) -> list:
    """Create visualization data for React frontend."""
    plot_data = _extract_plot_data(...)
    return [TextContent(type="text", text=json.dumps(plot_data, indent=2))]
```

## Expected JSON Structure

The tool should return JSON with this structure:

```json
{
  "type": "histogram|line|bar|pie|scatter|area",
  "data": [...],
  "title": "Chart Title",
  "column": "column_name",
  "x_label": "X Axis Label",
  "y_label": "Y Axis Label",
  "bins": 10
}
```

## SmartChart Integration

The SmartChart component automatically handles your tool output:

1. **String Detection**: Recognizes JSON string from tool output
2. **Parsing**: Converts JSON string to object using `JSON.parse()`
3. **Processing**: Uses `processSimpleChartData()` to format for visualization
4. **Rendering**: Displays using Recharts or Plotly based on chart type

## Supported Chart Types

### Histogram
```json
{
  "type": "histogram",
  "data": [1, 2, 3, 4, 5],
  "title": "Distribution",
  "column": "values"
}
```
*Automatically converted to bar chart format*

### Line Chart
```json
{
  "type": "line",
  "data": [1, 2, 3, 4, 5],
  "title": "Trend Over Time",
  "column": "metric"
}
```

### Bar Chart
```json
{
  "type": "bar",
  "data": [
    {"label": "A", "value": 10},
    {"label": "B", "value": 20}
  ],
  "title": "Comparison"
}
```

### Pie Chart
```json
{
  "type": "pie",
  "data": [
    {"label": "Category A", "value": 30},
    {"label": "Category B", "value": 70}
  ],
  "title": "Distribution"
}
```

## Usage in Chat

When your MCP tool returns visualization data:

1. User asks: "Create a histogram of the age column"
2. Tool returns: JSON string with chart data
3. Chat component receives tool result
4. SmartChart automatically detects and renders the chart
5. User sees interactive visualization with fullscreen capability

## Benefits

✅ **Seamless Integration**: No manual chart configuration needed  
✅ **Auto-Detection**: SmartChart recognizes your tool output format  
✅ **Professional Rendering**: Charts include tooltips, legends, and formatting  
✅ **Fullscreen Support**: Click any chart to view fullscreen  
✅ **Error Handling**: Graceful handling of malformed data  
✅ **Multiple Formats**: Supports both Recharts and Plotly rendering  

## Testing

To test the integration:

1. Use your `create_visualization` tool in a chat session
2. Verify the JSON output is properly formatted
3. Check that SmartChart renders the visualization correctly
4. Test fullscreen functionality by clicking the chart
5. Verify tooltips and interactions work as expected

The integration is now complete and ready for production use!
