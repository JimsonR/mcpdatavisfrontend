#!/usr/bin/env python3
"""
Test script for generating Recharts-compatible visualization data.
This simulates what your MCP server should return for optimal chart rendering.
"""

import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_sample_data():
    """Generate sample DataFrame for testing"""
    # Create sample sales data
    dates = pd.date_range(start='2024-01-01', end='2024-06-30', freq='D')
    categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports']
    regions = ['North', 'South', 'East', 'West']
    
    data = []
    for date in dates:
        for _ in range(np.random.randint(5, 15)):  # 5-15 sales per day
            data.append({
                'date': date.strftime('%Y-%m'),
                'category': np.random.choice(categories),
                'region': np.random.choice(regions),
                'sales': np.random.uniform(50, 500),
                'quantity': np.random.randint(1, 10)
            })
    
    return pd.DataFrame(data)

def create_line_chart(df):
    """Create line chart data for sales over time"""
    monthly_sales = df.groupby('date')['sales'].sum().round(2)
    
    return {
        "type": "line",
        "title": "Monthly Sales Trend",
        "x_label": "Month",
        "y_label": "Sales ($)",
        "data": [
            {"x": month, "y": float(sales)} 
            for month, sales in monthly_sales.items()
        ]
    }

def create_bar_chart(df):
    """Create bar chart data for sales by category"""
    category_sales = df.groupby('category')['sales'].sum().round(2)
    
    return {
        "type": "bar",
        "title": "Sales by Category",
        "x_label": "Category",
        "y_label": "Total Sales ($)",
        "data": [
            {"label": category, "value": float(sales)} 
            for category, sales in category_sales.items()
        ]
    }

def create_pie_chart(df):
    """Create pie chart data for sales by region"""
    region_sales = df.groupby('region')['sales'].sum()
    total_sales = region_sales.sum()
    
    return {
        "type": "pie",
        "title": "Sales Distribution by Region",
        "data": [
            {"label": region, "value": round((sales/total_sales)*100, 1)} 
            for region, sales in region_sales.items()
        ]
    }

def create_scatter_chart(df):
    """Create scatter chart data for quantity vs sales"""
    sample_data = df.sample(min(50, len(df)))  # Limit to 50 points for clarity
    
    return {
        "type": "scatter",
        "title": "Quantity vs Sales Amount",
        "x_label": "Quantity",
        "y_label": "Sales ($)",
        "data": [
            {"x": int(row['quantity']), "y": round(row['sales'], 2)} 
            for _, row in sample_data.iterrows()
        ]
    }

def create_area_chart(df):
    """Create area chart data for cumulative sales"""
    monthly_sales = df.groupby('date')['sales'].sum().cumsum().round(2)
    
    return {
        "type": "area",
        "title": "Cumulative Sales Growth",
        "x_label": "Month",
        "y_label": "Cumulative Sales ($)",
        "data": [
            {"x": month, "y": float(sales)} 
            for month, sales in monthly_sales.items()
        ]
    }

def simulate_mcp_run_script():
    """Simulate the run_script tool returning visualization data"""
    
    print("🔄 Generating sample dataset...")
    df = generate_sample_data()
    
    print(f"📊 Dataset created: {len(df)} records")
    print(f"📅 Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"💰 Total sales: ${df['sales'].sum():,.2f}")
    
    # Generate different chart types
    charts = {
        "line": create_line_chart(df),
        "bar": create_bar_chart(df),
        "pie": create_pie_chart(df),
        "scatter": create_scatter_chart(df),
        "area": create_area_chart(df)
    }
    
    print("\n" + "="*60)
    print("MCP SERVER RESPONSE EXAMPLES")
    print("="*60)
    
    # Example 1: Single chart
    print("\n🔹 EXAMPLE 1: Single Line Chart")
    print("```recharts")
    print(json.dumps(charts["line"], indent=2))
    print("```")
    
    # Example 2: Multiple charts
    print("\n🔹 EXAMPLE 2: Multiple Charts Dashboard")
    dashboard = {
        "plots": [
            charts["line"],
            charts["bar"],
            charts["pie"]
        ]
    }
    print("```recharts")
    print(json.dumps(dashboard, indent=2))
    print("```")
    
    # Example 3: Analysis text + chart
    print("\n🔹 EXAMPLE 3: Analysis + Visualization")
    analysis_text = f"""
## Sales Analysis Results

### Summary Statistics
- **Total Sales**: ${df['sales'].sum():,.2f}
- **Average Order**: ${df['sales'].mean():.2f}
- **Total Orders**: {len(df):,}
- **Top Category**: {df.groupby('category')['sales'].sum().idxmax()}

### Key Insights
- Monthly sales show {"upward" if df.groupby('date')['sales'].sum().iloc[-1] > df.groupby('date')['sales'].sum().iloc[0] else "downward"} trend
- {df.groupby('region')['sales'].sum().idxmax()} region leads in sales volume
- Average order value varies by category

The visualization below shows the monthly sales trend:
"""
    
    print(analysis_text)
    print("```recharts")
    print(json.dumps(charts["line"], indent=2))
    print("```")
    
    # Save examples to files for reference
    with open('chart_examples.json', 'w') as f:
        json.dump(charts, f, indent=2)
    
    print(f"\n✅ Chart examples saved to 'chart_examples.json'")
    print("\n📝 Copy any of the above examples to test in your MCP frontend!")

if __name__ == "__main__":
    simulate_mcp_run_script()
