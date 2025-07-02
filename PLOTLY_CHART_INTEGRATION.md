# Plotly Chart Integration

## Overview
The MCP Frontend now supports automatic detection and rendering of Plotly charts from AI responses. When the AI generates DataFrame visualizations or returns Plotly chart data, they will be automatically rendered as interactive charts in the chat.

## Features

### 1. **Automatic Chart Detection**
- Parses AI responses for JSON blocks containing Plotly chart data
- Supports both code blocks (```json) and inline JSON
- Filters out Python code blocks to focus on chart data

### 2. **Interactive Chart Rendering**
- Uses Plotly.js for rich, interactive visualizations
- Supports all Plotly chart types (line, bar, scatter, heatmap, etc.)
- Responsive design that adapts to container size
- Professional styling that matches the app theme

### 3. **Flexible Data Formats**
- Accepts standard Plotly format: `{data: [...], layout: {...}, config: {...}}`
- Also supports simplified format: `[{x: [...], y: [...], type: 'scatter'}]`
- Graceful error handling for malformed data

## Usage Examples

### 1. **Basic Chart from AI Response**
When your AI agent returns something like:
```
Here's the visualization of your data:

```json
{
  "data": [
    {
      "x": ["Jan", "Feb", "Mar", "Apr"],
      "y": [10, 15, 13, 17],
      "type": "scatter",
      "mode": "lines+markers",
      "name": "Sales"
    }
  ],
  "layout": {
    "title": "Monthly Sales",
    "xaxis": {"title": "Month"},
    "yaxis": {"title": "Sales ($1000s)"}
  }
}
```

The chart will be automatically extracted and rendered below the text.

### 2. **DataFrame Visualization**
If your MCP tool generates a DataFrame and creates a chart:
```python
import plotly.express as px
import pandas as pd

df = pd.DataFrame({
    'x': [1, 2, 3, 4],
    'y': [10, 11, 12, 13]
})

fig = px.line(df, x='x', y='y', title='Data Trend')
print(fig.to_json())  # This JSON will be detected and rendered
```

### 3. **Multiple Chart Types**
The system supports all Plotly chart types:
- **Line charts**: Time series, trends
- **Bar charts**: Categorical comparisons  
- **Scatter plots**: Correlation analysis
- **Heatmaps**: Matrix visualizations
- **Histograms**: Distribution analysis
- **Box plots**: Statistical summaries
- **3D plots**: Multi-dimensional data

## Technical Implementation

### Chart Detection Logic
```typescript
export function parseChartData(content: string): {
  hasChart: boolean;
  chartData?: any;
  textContent: string;
}
```

1. **JSON Block Detection**: Looks for ```json or ```plotly blocks
2. **Inline JSON Detection**: Checks individual lines for JSON objects
3. **Validation**: Ensures JSON contains Plotly-compatible data structure
4. **Text Cleaning**: Removes chart JSON from display text

### Message Structure
```typescript
interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string        // Text content (chart JSON removed)
  timestamp: Date
  chartData?: any       // Extracted chart data
}
```

### Chart Component
```typescript
<PlotlyChart 
  data={message.chartData.data || message.chartData} 
  layout={message.chartData.layout || {}}
  config={message.chartData.config || {}}
/>
```

## Backend Integration

### Option 1: MCP Tool Returns Chart Data
Your MCP tool can generate charts and return JSON:
```python
@app.post("/mcp/call-tool")
async def call_mcp_tool(server: str, tool_name: str, arguments: dict):
    # ... tool execution ...
    
    # If tool generates a chart
    if tool_name == "create_visualization":
        fig = create_plotly_chart(arguments)
        chart_json = fig.to_json()
        
        return {
            "content": f"Here's your visualization:\n\n```json\n{chart_json}\n```"
        }
```

### Option 2: Agent Mode with Data Analysis
Configure your agent to use data analysis tools that return charts:
```python
# In your FastAPI backend
@app.post("/llm/agent")
async def llm_agent(req: ChatRequest):
    # Agent can use MCP tools that create visualizations
    # Tools return chart data which gets included in response
    result = await agent.ainvoke({"messages": messages})
    return {"response": result['messages'][-1].content}
```

## Styling and Customization

### Default Chart Settings
- **Responsive**: Charts adapt to container width
- **Interactive**: Zoom, pan, hover tooltips enabled
- **Professional**: Clean styling matching app theme
- **Height**: Fixed 400px height for consistency

### Custom Styling
Charts inherit from these CSS classes:
```css
.plotly-chart {
  @apply w-full;
}

.plotly-chart .modebar {
  @apply bg-white border border-gray-200 rounded shadow-sm;
}
```

## Message Layout Updates

### Enhanced Message Bubbles
- **Increased Width**: `max-w-2xl` for chart-containing messages
- **Chart Container**: White background with border for charts
- **Responsive Design**: Charts scale with container

### Visual Hierarchy
1. **Text Content**: Displayed first
2. **Chart**: Rendered below text with spacing
3. **Timestamp**: Appears below chart

## Error Handling

### Graceful Degradation
- **Invalid JSON**: Shown as regular text if parsing fails
- **Missing Chart Data**: Only renders if valid Plotly structure detected
- **Rendering Errors**: Shows error message instead of broken chart

### Console Logging
- Chart parsing errors logged for debugging
- Plotly rendering errors captured and displayed

## Examples for Testing

### Simple Line Chart
```json
{
  "data": [{"x": [1,2,3,4], "y": [10,11,12,13], "type": "scatter"}],
  "layout": {"title": "Test Chart"}
}
```

### Bar Chart with Styling
```json
{
  "data": [{"x": ["A","B","C"], "y": [1,3,2], "type": "bar", "marker": {"color": "blue"}}],
  "layout": {"title": "Category Comparison", "xaxis": {"title": "Category"}, "yaxis": {"title": "Value"}}
}
```

This integration allows your MCP tools to create rich, interactive data visualizations that enhance the user experience significantly!
