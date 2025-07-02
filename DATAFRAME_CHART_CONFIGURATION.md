# DataFrame Chart Configuration Guide

## Overview
The MCP Frontend is configured to automatically detect and render Plotly charts generated from DataFrames using the `run_script` tool. This guide explains how to configure your scripts to generate charts that will be automatically displayed.

## Supported DataFrame Chart Generation Methods

### 1. **Using Plotly Express (Recommended)**
```python
import pandas as pd
import plotly.express as px
import json

# Load your data
df = pd.DataFrame({
    'x': [1, 2, 3, 4, 5],
    'y': [10, 15, 13, 17, 20]
})

# Create chart
fig = px.line(df, x='x', y='y', title='DataFrame Visualization')

# Output chart JSON for automatic detection
print("Chart data:")
print(json.dumps(fig.to_dict(), indent=2))
```

### 2. **Using Plotly Graph Objects**
```python
import pandas as pd
import plotly.graph_objects as go
import json

df = pd.DataFrame({
    'categories': ['A', 'B', 'C', 'D'],
    'values': [23, 45, 56, 78]
})

fig = go.Figure(data=go.Bar(x=df['categories'], y=df['values']))
fig.update_layout(title='Category Analysis')

# Output for automatic detection
print("```json")
print(json.dumps(fig.to_dict(), indent=2))
print("```")
```

### 3. **Using Pandas Built-in Plotting**
```python
import pandas as pd
import plotly.io as pio
import json

df = pd.DataFrame({
    'date': pd.date_range('2024-01-01', periods=10),
    'sales': [100, 120, 140, 110, 160, 180, 200, 190, 220, 240]
})

# Use pandas plotting with plotly backend
pd.options.plotting.backend = "plotly"
fig = df.plot(x='date', y='sales', title='Sales Trend')

# Convert to JSON for automatic detection
chart_data = fig.to_dict()
print("Visualization:")
print(json.dumps(chart_data, indent=2, default=str))
```

## Chart Detection Patterns

The frontend automatically detects charts in several formats:

### 1. **JSON Code Blocks**
```markdown
Here's your chart:

```json
{
  "data": [{"x": [1,2,3], "y": [4,5,6], "type": "scatter"}],
  "layout": {"title": "My Chart"}
}
```
```

### 2. **Output Blocks**
```markdown
```output
{
  "data": [...],
  "layout": {...}
}
```
```

### 3. **Labeled JSON**
```markdown
Chart data: {"data": [...], "layout": {...}}
```

### 4. **Figure Objects**
```markdown
Visualization: {"figure": {"data": [...], "layout": {...}}}
```

## Best Practices for run_script Tool

### 1. **Complete Script Example**
```python
# Load and process data
import pandas as pd
import plotly.express as px
import json

# Your data processing
df = pd.read_csv('your_data.csv')  # or create DataFrame
processed_df = df.groupby('category').sum().reset_index()

# Create visualization
fig = px.bar(processed_df, x='category', y='value', 
             title='Category Analysis',
             labels={'value': 'Total Value', 'category': 'Category'})

# Add styling
fig.update_layout(
    xaxis_title="Categories",
    yaxis_title="Values",
    showlegend=True,
    height=400
)

# Print both summary and chart
print("Data Summary:")
print(processed_df.to_string())
print("\nVisualization:")
print(json.dumps(fig.to_dict(), indent=2, default=str))
```

### 2. **Multiple Charts**
```python
import plotly.subplots as sp

# Create subplot
fig = sp.make_subplots(
    rows=2, cols=1,
    subplot_titles=('Sales Over Time', 'Revenue Distribution')
)

# Add traces
fig.add_trace(go.Scatter(x=df['date'], y=df['sales']), row=1, col=1)
fig.add_trace(go.Histogram(x=df['revenue']), row=2, col=1)

fig.update_layout(title='Dashboard Overview')

print("Dashboard:")
print(json.dumps(fig.to_dict(), indent=2, default=str))
```

## Error Handling

### 1. **Data Validation**
```python
# Always validate your data before plotting
if df.empty:
    print("No data available for visualization")
else:
    fig = px.line(df, x='x', y='y')
    print(json.dumps(fig.to_dict(), indent=2, default=str))
```

### 2. **Graceful Fallbacks**
```python
try:
    fig = px.scatter(df, x='x', y='y', title='Scatter Plot')
    print("Chart data:")
    print(json.dumps(fig.to_dict(), indent=2, default=str))
except Exception as e:
    print(f"Could not create chart: {e}")
    print("Data summary instead:")
    print(df.describe())
```

## Chart Types Supported

The frontend supports all Plotly chart types:

- **Line Charts**: Time series, trends
- **Bar Charts**: Categorical comparisons
- **Scatter Plots**: Correlation analysis
- **Histograms**: Distribution analysis
- **Box Plots**: Statistical summaries
- **Heatmaps**: Correlation matrices
- **3D Plots**: Multi-dimensional data
- **Subplots**: Multiple charts in one figure
- **Statistical Charts**: Violin plots, density plots

## Configuration Tips

### 1. **Responsive Design**
Charts automatically resize to fit the chat interface. No need to set specific width/height in most cases.

### 2. **Color Schemes**
Use consistent color schemes that work well in the chat interface:
```python
fig.update_traces(marker_color='#3B82F6')  # Primary blue
fig.update_layout(colorway=['#3B82F6', '#10B981', '#F59E0B', '#EF4444'])
```

### 3. **Interactive Features**
Enable helpful interactive features:
```python
fig.update_layout(
    hovermode='x unified',  # Better hover display
    showlegend=True,        # Always show legend
    legend=dict(x=0, y=1)   # Position legend
)
```

## Usage in Chat

1. **Use Agent Mode**: Enable "Agent Mode" in the chat to access MCP tools
2. **Ask for Data Analysis**: "Load the sales data and create a visualization"
3. **Automatic Detection**: Charts will automatically appear below the response
4. **Interactive**: Charts are fully interactive with zoom, pan, and hover

## Example Chat Prompts

- "Load the CSV file and create a line chart showing trends over time"
- "Analyze the data and create a bar chart comparing categories"
- "Generate a correlation heatmap for the numeric columns"
- "Create a dashboard with multiple charts showing key metrics"

The frontend will automatically detect and render any Plotly charts generated by your `run_script` executions!
