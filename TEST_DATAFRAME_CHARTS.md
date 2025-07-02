# Test DataFrame Chart Generation

This script demonstrates various ways to generate charts from DataFrames that will be automatically detected and displayed in the MCP Frontend.

## Test Script for run_script Tool

```python
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import json
import numpy as np

print("=== DataFrame Chart Generation Test ===\n")

# Create sample data
np.random.seed(42)
dates = pd.date_range('2024-01-01', periods=30, freq='D')
sales = np.random.normal(1000, 200, 30) + np.arange(30) * 10
categories = ['A', 'B', 'C', 'D', 'E']
category_values = np.random.randint(50, 200, 5)

df_timeseries = pd.DataFrame({
    'date': dates,
    'sales': sales,
    'category': np.random.choice(categories, 30)
})

df_categories = pd.DataFrame({
    'category': categories,
    'value': category_values
})

print("Sample Data Created:")
print("Time Series Data:", df_timeseries.head().to_string())
print("\nCategory Data:", df_categories.to_string())

# Test 1: Simple Line Chart
print("\n--- Test 1: Line Chart ---")
fig1 = px.line(df_timeseries, x='date', y='sales', 
               title='Sales Trend Over Time',
               labels={'sales': 'Sales ($)', 'date': 'Date'})

print("Chart data:")
print(json.dumps(fig1.to_dict(), indent=2, default=str))

# Test 2: Bar Chart
print("\n--- Test 2: Bar Chart ---")
fig2 = px.bar(df_categories, x='category', y='value',
              title='Category Comparison',
              color='value',
              color_continuous_scale='viridis')

print("```json")
print(json.dumps(fig2.to_dict(), indent=2, default=str))
print("```")

# Test 3: Scatter Plot with Categories
print("\n--- Test 3: Scatter Plot ---")
fig3 = px.scatter(df_timeseries, x='date', y='sales', color='category',
                  title='Sales by Category Over Time',
                  size='sales', hover_data=['category'])

print("Visualization:")
print(json.dumps(fig3.to_dict(), indent=2, default=str))

print("\n=== Charts should now be displayed in the chat interface! ===")
```

## To Test This:

1. **Enable Agent Mode** in the chat interface
2. **Send a message** like: "Use the run_script tool to execute the DataFrame chart test"
3. **Watch the charts appear** automatically below the assistant's response

## Expected Results:

- Line chart showing sales trend over time
- Colorful bar chart comparing categories  
- Scatter plot with category colors and sizing

All charts should be interactive with hover tooltips, zoom, and pan functionality!
