"""
Enhanced MCP Chart Tools - Better Graphs, Minimal Context
This demonstrates how to create richer visualizations without exceeding context limits.
"""

import json
import pandas as pd
import numpy as np
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from typing import List, Dict, Any

# Smart data sampling and aggregation functions
def smart_sample_data(df: pd.DataFrame, column: str, max_points: int = 50) -> List[Any]:
    """Intelligently sample data to stay within context limits while preserving patterns."""
    
    if len(df) <= max_points:
        return df[column].tolist()
    
    # For numeric data, use percentile-based sampling
    if pd.api.types.is_numeric_dtype(df[column]):
        # Include min, max, quartiles, and evenly distributed samples
        key_percentiles = np.linspace(0, 100, max_points-4)
        samples = df[column].quantile(key_percentiles/100).tolist()
        
        # Add actual min/max for accuracy
        samples[0] = df[column].min()
        samples[-1] = df[column].max()
        
        return samples
    
    # For categorical data, use frequency-based sampling
    elif df[column].dtype == 'object':
        value_counts = df[column].value_counts()
        top_values = value_counts.head(max_points).index.tolist()
        return top_values
    
    # For datetime, use time-based sampling
    elif pd.api.types.is_datetime64_any_dtype(df[column]):
        # Sample evenly across time range
        time_range = pd.date_range(df[column].min(), df[column].max(), periods=max_points)
        return [t.strftime('%Y-%m-%d') for t in time_range]
    
    # Default: random sampling
    return df[column].sample(n=min(max_points, len(df))).tolist()

def create_enhanced_histogram(df: pd.DataFrame, column: str, title: str = None) -> Dict[str, Any]:
    """Create an enhanced histogram with better styling and context efficiency."""
    
    # Smart sampling for large datasets
    if len(df) > 100:
        # Use statistical summary instead of raw data
        data = df[column].describe()
        
        # Create histogram bins based on quartiles
        q1, q2, q3 = data['25%'], data['50%'], data['75%']
        min_val, max_val = data['min'], data['max']
        
        # Create meaningful bins
        bins = [
            {'range': f'< {q1:.0f}', 'count': len(df[df[column] < q1])},
            {'range': f'{q1:.0f} - {q2:.0f}', 'count': len(df[(df[column] >= q1) & (df[column] < q2)])},
            {'range': f'{q2:.0f} - {q3:.0f}', 'count': len(df[(df[column] >= q2) & (df[column] < q3)])},
            {'range': f'> {q3:.0f}', 'count': len(df[df[column] > q3])},
        ]
        
        chart_data = [{'label': bin_data['range'], 'value': bin_data['count']} for bin_data in bins]
    else:
        # For smaller datasets, use actual values
        hist, bin_edges = np.histogram(df[column], bins=min(10, len(df)//5))
        chart_data = [
            {'label': f'{bin_edges[i]:.0f}-{bin_edges[i+1]:.0f}', 'value': int(hist[i])}
            for i in range(len(hist))
        ]
    
    return {
        'type': 'bar',
        'data': chart_data,
        'title': title or f'Distribution of {column}',
        'x_label': column,
        'y_label': 'Frequency',
        'styling': {
            'color_scheme': 'business' if 'sales' in column.lower() else 'default',
            'show_trend': True,
            'gradient_fill': True
        },
        'metadata': {
            'original_size': len(df),
            'chart_type': 'enhanced_histogram',
            'optimization': 'statistical_binning'
        }
    }

def create_enhanced_line_chart(df: pd.DataFrame, column: str, title: str = None) -> Dict[str, Any]:
    """Create an enhanced line chart with trend analysis."""
    
    # Smart time-based sampling
    if pd.api.types.is_datetime64_any_dtype(df[column]):
        # Group by time periods for large datasets
        if len(df) > 50:
            df_copy = df.copy()
            df_copy['period'] = pd.to_datetime(df_copy[column]).dt.to_period('M')
            grouped = df_copy.groupby('period').size()
            
            chart_data = [
                {'x': i, 'y': count, 'label': str(period)}
                for i, (period, count) in enumerate(grouped.items())
            ]
        else:
            chart_data = [
                {'x': i, 'y': 1, 'label': str(val)}
                for i, val in enumerate(df[column])
            ]
    else:
        # For non-date data, use value sampling
        sampled_data = smart_sample_data(df, column, 30)
        chart_data = [
            {'x': i, 'y': val if pd.api.types.is_numeric_dtype(df[column]) else i+1, 'label': str(val)}
            for i, val in enumerate(sampled_data)
        ]
    
    # Add trend analysis
    if len(chart_data) > 3 and all(isinstance(point['y'], (int, float)) for point in chart_data):
        y_values = [point['y'] for point in chart_data]
        trend = 'increasing' if y_values[-1] > y_values[0] else 'decreasing'
    else:
        trend = 'stable'
    
    return {
        'type': 'line',
        'data': chart_data,
        'title': title or f'{column} Trend Analysis',
        'x_label': 'Time Period' if pd.api.types.is_datetime64_any_dtype(df[column]) else 'Index',
        'y_label': column,
        'styling': {
            'color_scheme': 'professional',
            'show_trend_line': True,
            'gradient_area': True,
            'smooth_curves': True
        },
        'insights': {
            'trend': trend,
            'data_points': len(chart_data),
            'time_range': f"{chart_data[0]['label']} to {chart_data[-1]['label']}" if chart_data else None
        },
        'metadata': {
            'original_size': len(df),
            'sampling_method': 'time_based' if pd.api.types.is_datetime64_any_dtype(df[column]) else 'smart_sample'
        }
    }

def create_smart_dashboard(df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
    """Create a multi-chart dashboard with minimal context usage."""
    
    dashboard_config = {
        'type': 'dashboard',
        'title': f'Analysis Dashboard ({len(df)} records)',
        'layout': 'responsive_grid',
        'charts': []
    }
    
    for i, column in enumerate(columns[:4]):  # Limit to 4 charts to save context
        if pd.api.types.is_numeric_dtype(df[column]):
            # Create compact histogram
            chart = create_enhanced_histogram(df, column)
            chart['position'] = {'row': i//2, 'col': i%2}
            chart['size'] = 'compact'
            dashboard_config['charts'].append(chart)
        
        elif pd.api.types.is_datetime64_any_dtype(df[column]):
            # Create compact timeline
            chart = create_enhanced_line_chart(df, column)
            chart['position'] = {'row': i//2, 'col': i%2}
            chart['size'] = 'compact'
            dashboard_config['charts'].append(chart)
    
    return dashboard_config

# Usage examples that generate better charts with minimal context:

@mcp.tool()
def create_optimized_chart(df_name: str, chart_type: str, column: str, 
                          max_context: int = 1000) -> List[Any]:
    """Create enhanced charts optimized for context efficiency."""
    
    global _dataframes
    if df_name not in _dataframes:
        return [TextContent(type="text", text=f"DataFrame '{df_name}' not found")]
    
    df = _dataframes[df_name]
    
    try:
        if chart_type == "enhanced_histogram":
            chart_data = create_enhanced_histogram(df, column)
            
        elif chart_type == "trend_analysis":
            chart_data = create_enhanced_line_chart(df, column)
            
        elif chart_type == "smart_dashboard":
            columns = [column] + [col for col in df.columns if col != column][:3]
            chart_data = create_smart_dashboard(df, columns)
            
        else:
            return [TextContent(type="text", text="Supported: enhanced_histogram, trend_analysis, smart_dashboard")]
        
        # Ensure response stays under context limit
        response_text = json.dumps(chart_data, indent=2)
        if len(response_text) > max_context:
            # Fallback to compact format
            chart_data['data'] = chart_data['data'][:10]  # Limit data points
            chart_data['note'] = f"Data truncated for context efficiency (showing top 10 of {len(df)} records)"
        
        return [TextContent(type="text", text=json.dumps(chart_data, indent=2))]
    
    except Exception as e:
        return [TextContent(type="text", text=f"Error creating enhanced chart: {str(e)}")]

# Chart templates for common business scenarios
BUSINESS_CHART_TEMPLATES = {
    'sales_analysis': {
        'primary_chart': 'enhanced_histogram',
        'secondary_chart': 'trend_analysis',
        'color_scheme': 'business',
        'insights': ['trend', 'outliers', 'seasonality']
    },
    'performance_dashboard': {
        'layout': 'four_quadrant',
        'charts': ['histogram', 'line', 'bar', 'pie'],
        'color_scheme': 'professional'
    },
    'data_overview': {
        'adaptive': True,
        'max_charts': 4,
        'auto_select_types': True
    }
}

print("Enhanced MCP Chart Tools loaded!")
print("Available functions:")
print("- create_optimized_chart(df_name, 'enhanced_histogram', column)")
print("- create_optimized_chart(df_name, 'trend_analysis', column)")  
print("- create_optimized_chart(df_name, 'smart_dashboard', column)")
print("\nFeatures: Smart sampling, context optimization, enhanced styling, trend analysis")
