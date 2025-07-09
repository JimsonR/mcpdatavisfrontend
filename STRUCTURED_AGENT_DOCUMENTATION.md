# Structured Agent Mode

The chat frontend now supports a new "Structured Agent" mode that provides enhanced formatting and visualization capabilities for AI responses.

## Features

### 🏷️ **Structured Tags Support**

The frontend can parse and render special formatting tags:

- `<thinking>` - Displays reasoning/thought processes in a yellow highlighted block
- `<tool_call>` - Shows tool execution calls in blue blocks with structured information
- `<tool_name>` - Displays the name of the tool being called
- `<args>` - Shows tool arguments in formatted JSON
- `<tool_result>` - Displays tool execution results with smart formatting
- `<result>` - Shows final results in green highlighted blocks

### 📊 **Enhanced Chart Rendering**

- **Inline Charts**: Charts embedded in JSON code blocks are automatically detected and rendered
- **Tool Result Charts**: Chart data in tool results is automatically visualized
- **Tool Execution Charts**: Charts from tool executions (like `create_visualization`) are automatically displayed
- **Multiple Formats**: Supports various chart types (line, bar, area, pie, scatter, etc.)
- **Smart Detection**: Automatically identifies chart data in tool responses vs. regular JSON

### 🎨 **Visual Enhancements**

- **Color-coded Blocks**: Different tag types have distinct visual styling
- **Smart Parsing**: Automatically detects chart data vs. regular JSON
- **Responsive Layout**: Charts and content adapt to different screen sizes
- **Error Handling**: Graceful fallbacks for malformed data

## Usage

1. **Enable Structured Agent Mode**: Select the "Structured Agent" radio button in the chat interface
2. **Send Messages**: Chat normally - the AI will respond with structured formatting
3. **View Results**: See enhanced formatting with:
   - Reasoning steps in thinking blocks
   - Tool calls with arguments and results
   - Automatic chart rendering from tool executions
   - Charts embedded in tool results
   - Final results clearly highlighted

## Example Response Format

```
<thinking>
I need to analyze the sales data and create a visualization...
</thinking>

Let me load your data and create a chart:

<tool_call>
<tool_name>load_csv</tool_name>
<args>{"csv_path": "sales.csv"}</args>
<tool_result>Successfully loaded 1000 rows of sales data</tool_result>
</tool_call>

<tool_call>
<tool_name>create_visualization</tool_name>
<args>{"type": "line", "x": "Date", "y": "Sales"}</args>
<tool_result>{"type": "line", "data": {...chart data...}}</tool_result>
</tool_call>

<result>
Your sales data shows strong growth trends with seasonal patterns...
</result>
```

## Tool Execution Chart Example

When tools like `create_visualization` return chart data, it's automatically detected and rendered:

**Tool Response with Chart Data:**

```json
{
  "type": "bar",
  "bars": [
    { "label": "Product A", "value": 15000 },
    { "label": "Product B", "value": 22000 },
    { "label": "Product C", "value": 18000 }
  ],
  "title": "Sales by Product"
}
```

This will be automatically displayed as an interactive chart in the structured response.

## Technical Implementation

### Components

- **StructuredResponseRenderer**: Main component for parsing and rendering structured responses
- **Enhanced Chat.tsx**: Updated to use structured renderer for assistant messages
- **SmartChart Integration**: Automatic chart detection and rendering

### Parsing Logic

- **Tag Extraction**: Uses regex patterns to identify and extract structured tags
- **Chart Detection**: Smart detection of chart data in JSON blocks, tool results, and tool executions
- **Tool Execution Integration**: Automatically processes tool executions for chart data
- **Block Organization**: Maintains proper ordering of thinking, tool calls, and results

### Styling

- **Tailwind CSS**: Consistent styling with color-coded blocks
- **Responsive Design**: Works across different screen sizes
- **Accessibility**: Proper contrast and visual hierarchy
