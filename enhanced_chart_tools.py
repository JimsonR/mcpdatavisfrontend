"""
Enhanced MCP chart creation tool that works seamlessly with SmartChart component.
This is an improved version of your create_simple_chart tool.
"""

import json
import pandas as pd
from typing import List, Dict, Any
from mcp import types
from mcp.types import TextContent

@mcp.tool()
def create_enhanced_chart(df_name: str, chart_type: str, column: str = None, 
                         group_by: str = None, title: str = None) -> List[TextContent]:
    """
    Create enhanced chart data optimized for the SmartChart frontend component.
    
    Args:
        df_name: Name of the DataFrame to use
        chart_type: Type of chart (histogram, line, bar, pie, scatter)
        column: Column to visualize (required for most chart types)
        group_by: Column to group by (for bar/pie charts)
        title: Custom title for the chart
    """
    global _dataframes
    
    if df_name not in _dataframes:
        return [TextContent(type="text", text=f"DataFrame '{df_name}' not found")]
    
    df = _dataframes[df_name]
    
    try:
        chart_data = None
        
        if chart_type == "histogram" and column:
            # Create histogram data
            values = df[column].dropna()
            hist, bins = pd.cut(values, bins=10, retbins=True)
            counts = hist.value_counts().sort_index()
            
            chart_data = {
                "type": "bar",
                "title": title or f"Distribution of {column}",
                "x_label": column,
                "y_label": "Frequency",
                "data": [
                    {"label": f"{interval.left:.0f}-{interval.right:.0f}", "value": count}
                    for interval, count in counts.items()
                ]
            }
            
        elif chart_type == "line" and column:
            # Create line chart data
            if pd.api.types.is_datetime64_any_dtype(df[column]):
                # Time series data
                df_sorted = df.sort_values(column)
                chart_data = {
                    "type": "line",
                    "title": title or f"{column} Over Time",
                    "x_label": "Date",
                    "y_label": column,
                    "data": [
                        {"x": row[column].strftime('%Y-%m-%d'), "y": idx}
                        for idx, (_, row) in enumerate(df_sorted.iterrows())
                    ]
                }
            else:
                # Regular line chart
                chart_data = {
                    "type": "line",
                    "title": title or f"{column} Trend",
                    "x_label": "Index",
                    "y_label": column,
                    "data": [
                        {"x": idx, "y": value}
                        for idx, value in enumerate(df[column].dropna().tolist())
                    ]
                }
                
        elif chart_type == "bar" and column:
            if group_by:
                # Grouped bar chart
                grouped = df.groupby(group_by)[column].sum().sort_values(ascending=False)
                chart_data = {
                    "type": "bar",
                    "title": title or f"{column} by {group_by}",
                    "x_label": group_by,
                    "y_label": f"Total {column}",
                    "data": [
                        {"label": str(category), "value": float(value)}
                        for category, value in grouped.head(10).items()
                    ]
                }
            else:
                # Value counts
                counts = df[column].value_counts().head(10)
                chart_data = {
                    "type": "bar",
                    "title": title or f"{column} Distribution",
                    "x_label": column,
                    "y_label": "Count",
                    "data": [
                        {"label": str(category), "value": count}
                        for category, count in counts.items()
                    ]
                }
                
        elif chart_type == "pie" and column:
            if group_by:
                # Pie chart by group
                grouped = df.groupby(group_by)[column].sum()
                total = grouped.sum()
                chart_data = {
                    "type": "pie",
                    "title": title or f"{column} Distribution by {group_by}",
                    "data": [
                        {"label": str(category), "value": round((value/total)*100, 1)}
                        for category, value in grouped.head(8).items()
                    ]
                }
            else:
                # Value counts as pie
                counts = df[column].value_counts().head(8)
                chart_data = {
                    "type": "pie",
                    "title": title or f"{column} Distribution",
                    "data": [
                        {"label": str(category), "value": count}
                        for category, count in counts.items()
                    ]
                }
                
        elif chart_type == "scatter" and column and group_by:
            # Scatter plot between two columns
            sample_df = df[[column, group_by]].dropna().sample(min(100, len(df)))
            chart_data = {
                "type": "scatter",
                "title": title or f"{column} vs {group_by}",
                "x_label": column,
                "y_label": group_by,
                "data": [
                    {"x": float(row[column]), "y": float(row[group_by])}
                    for _, row in sample_df.iterrows()
                ]
            }
        else:
            return [TextContent(type="text", text="""
Supported chart types:
- histogram: column (required)
- line: column (required)
- bar: column (required), group_by (optional)
- pie: column (required), group_by (optional)
- scatter: column and group_by (both required)

Examples:
- create_enhanced_chart('df_1', 'histogram', 'SALES')
- create_enhanced_chart('df_1', 'bar', 'SALES', 'COUNTRY')
- create_enhanced_chart('df_1', 'pie', 'QUANTITYORDERED', 'PRODUCTLINE')
- create_enhanced_chart('df_1', 'scatter', 'SALES', 'QUANTITYORDERED')
            """)]
        
        if chart_data:
            # Return the chart data in a format the frontend will auto-detect
            response = f"""Chart created successfully!

```recharts
{json.dumps(chart_data, indent=2)}
```"""
            return [TextContent(type="text", text=response)]
        
    except Exception as e:
        return [TextContent(type="text", text=f"Error creating chart: {str(e)}")]

@mcp.tool()
def create_dashboard(df_name: str, columns: List[str] = None) -> List[TextContent]:
    """
    Create a multi-chart dashboard for quick data exploration.
    
    Args:
        df_name: Name of the DataFrame to analyze
        columns: List of columns to focus on (optional, will auto-select if not provided)
    """
    global _dataframes
    
    if df_name not in _dataframes:
        return [TextContent(type="text", text=f"DataFrame '{df_name}' not found")]
    
    df = _dataframes[df_name]
    
    try:
        # Auto-select interesting columns if not provided
        if not columns:
            numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
            categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
            columns = (numeric_cols[:3] + categorical_cols[:2])[:4]  # Max 4 charts
        
        charts = []
        
        for col in columns[:4]:  # Limit to 4 charts
            if df[col].dtype in ['int64', 'float64']:
                # Numeric column - create histogram
                values = df[col].dropna()
                hist, bins = pd.cut(values, bins=8, retbins=True)
                counts = hist.value_counts().sort_index()
                
                charts.append({
                    "type": "bar",
                    "title": f"Distribution of {col}",
                    "x_label": col,
                    "y_label": "Frequency",
                    "data": [
                        {"label": f"{interval.left:.0f}-{interval.right:.0f}", "value": count}
                        for interval, count in counts.items()
                    ]
                })
            else:
                # Categorical column - create pie chart
                counts = df[col].value_counts().head(6)
                charts.append({
                    "type": "pie",
                    "title": f"{col} Distribution",
                    "data": [
                        {"label": str(category), "value": count}
                        for category, count in counts.items()
                    ]
                })
        
        dashboard_data = {"plots": charts}
        
        response = f"""Dashboard created for {len(charts)} key columns!

```recharts
{json.dumps(dashboard_data, indent=2)}
```"""
        
        return [TextContent(type="text", text=response)]
        
    except Exception as e:
        return [TextContent(type="text", text=f"Error creating dashboard: {str(e)}")]

# Usage examples for testing:
"""
# Single charts
create_enhanced_chart('df_1', 'histogram', 'SALES')
create_enhanced_chart('df_1', 'bar', 'SALES', 'COUNTRY') 
create_enhanced_chart('df_1', 'pie', 'QUANTITYORDERED', 'PRODUCTLINE')
create_enhanced_chart('df_1', 'line', 'ORDERDATE')
create_enhanced_chart('df_1', 'scatter', 'SALES', 'QUANTITYORDERED')

# Dashboard
create_dashboard('df_1', ['SALES', 'COUNTRY', 'PRODUCTLINE'])
"""
