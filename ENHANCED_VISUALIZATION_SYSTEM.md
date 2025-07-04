# Enhanced Visualization System

## Overview

The MCP frontend now supports dual visualization systems:
- **Plotly.js**: For advanced, interactive charts (existing)
- **Recharts**: For fast, lightweight charts optimized for data science workflows (new)

## New Components

### SmartChart Component
- **Location**: `src/components/SmartChart.tsx`
- **Purpose**: Unified chart rendering that automatically chooses between Plotly and Recharts
- **Features**:
  - Auto-detection of chart data format
  - Support for both Plotly and Recharts data structures
  - Configurable rendering preference
  - Built-in debug capabilities
  - Responsive design

### ChartDemo Page
- **Location**: `src/pages/ChartDemo.tsx`
- **Route**: `/charts`
- **Purpose**: Interactive demonstration of all chart types
- **Features**:
  - Live chart type switching
  - Sample data for each chart type
  - Backend integration examples
  - Usage documentation

## Supported Chart Types (Recharts)

### 1. Line Chart
```json
{
  "type": "line",
  "title": "Sales Over Time",
  "x_label": "Month",
  "y_label": "Sales ($)",
  "data": [
    {"x": "2024-01", "y": 12500},
    {"x": "2024-02", "y": 15600}
  ]
}
```

### 2. Bar Chart
```json
{
  "type": "bar",
  "title": "Sales by Category",
  "x_label": "Category",
  "y_label": "Sales ($)",
  "data": [
    {"label": "Electronics", "value": 45200},
    {"label": "Clothing", "value": 32100}
  ]
}
```

### 3. Pie Chart
```json
{
  "type": "pie",
  "title": "Sales by Region",
  "data": [
    {"label": "North", "value": 35},
    {"label": "South", "value": 28}
  ]
}
```

### 4. Scatter Plot
```json
{
  "type": "scatter",
  "title": "Price vs Volume",
  "x_label": "Price ($)",
  "y_label": "Volume",
  "data": [
    {"x": 10, "y": 100},
    {"x": 20, "y": 85}
  ]
}
```

### 5. Area Chart
```json
{
  "type": "area",
  "title": "Cumulative Revenue",
  "x_label": "Quarter",
  "y_label": "Revenue ($)",
  "data": [
    {"x": "Q1", "y": 25000},
    {"x": "Q2", "y": 47000}
  ]
}
```

## Backend Integration

### Enhanced parseChartData Function
- **Location**: `src/lib/utils.ts`
- **New Features**:
  - Detects both Plotly and Recharts formats
  - Returns chart type information
  - Enhanced pattern matching for various data structures

### MCP Server Integration

#### Method 1: Code Block Format
Return chart data in markdown code blocks:

```python
import json

# Your data processing
chart_data = {
    "type": "bar",
    "title": "Analysis Results",
    "data": [{"label": "A", "value": 100}]
}

print("```recharts")
print(json.dumps(chart_data, indent=2))
print("```")
```

#### Method 2: Multiple Charts
Return multiple visualizations:

```python
results = {
    "plots": [
        {
            "type": "line",
            "title": "Trend Analysis",
            "data": [{"x": "Jan", "y": 100}]
        },
        {
            "type": "pie",
            "title": "Distribution",
            "data": [{"label": "A", "value": 60}]
        }
    ]
}

print("```recharts")
print(json.dumps(results, indent=2))
print("```")
```

## Frontend Integration

### Chat Component Updates
- **Enhanced Chart Detection**: Supports both Plotly and Recharts formats
- **Smart Rendering**: Automatically chooses the appropriate chart component
- **Type Information**: Tracks chart type for optimal rendering

### Chart Rendering Logic
```typescript
{message.chartData && (
  <div className="chart-container mt-3">
    {message.chartData.type === 'recharts' ? (
      <SmartChart 
        chartData={message.chartData.data}
        preferRecharts={true}
      />
    ) : (
      <PlotlyChart 
        data={message.chartData.data || message.chartData} 
        layout={message.chartData.layout || {}}
        config={message.chartData.config || {}}
      />
    )}
  </div>
)}
```

## Performance Benefits

### Recharts Advantages
- **Faster Loading**: Smaller bundle size compared to Plotly
- **Better Performance**: React-native rendering, no canvas overhead
- **Mobile Friendly**: Touch-optimized interactions
- **Customizable**: Easy to style with CSS/Tailwind

### When to Use Each
- **Use Recharts**: Simple charts, dashboards, real-time data, mobile apps
- **Use Plotly**: Complex 3D visualizations, scientific plots, advanced interactions

## Styling and Customization

### Chart Container Styling
```css
.chart-container {
  @apply bg-white rounded-lg shadow-sm border p-4;
}

.smart-chart {
  @apply w-full;
}
```

### Color Palette
The system uses a consistent 8-color palette:
```typescript
const COLORS = [
  '#0088FE', // Blue
  '#00C49F', // Teal
  '#FFBB28', // Yellow
  '#FF8042', // Orange
  '#8884D8', // Purple
  '#82CA9D', // Green
  '#FFC658', // Gold
  '#FF7C7C'  // Pink
]
```

## Error Handling

### Chart Rendering Errors
- Graceful fallback to error messages
- Debug information available
- Data validation before rendering

### Data Format Validation
- Type checking for required fields
- Fallback to alternative chart types
- Clear error messages for developers

## Testing

### Manual Testing
1. Navigate to `/charts` route
2. Test all chart types with sample data
3. Verify responsive behavior
4. Check debug functionality

### Data Testing
Use the ChartDemo page to test various data formats and ensure compatibility with your backend data structures.

## Future Enhancements

### Planned Features
1. **Animation Support**: Smooth transitions between data updates
2. **Export Functionality**: Download charts as images/PDFs
3. **Interactive Filtering**: Click-to-filter data points
4. **Real-time Updates**: WebSocket integration for live data
5. **Custom Themes**: Multiple color schemes and styling options

### Backend Improvements
1. **Auto-detection**: Automatically choose best chart type for data
2. **Data Aggregation**: Smart grouping and summarization
3. **Statistical Overlays**: Trend lines, confidence intervals
4. **Caching**: Optimize performance for large datasets

The enhanced visualization system provides a comprehensive solution for data science workflows while maintaining compatibility with existing Plotly implementations.
