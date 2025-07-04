# Test script for DataFrame chart generation
import pandas as pd
import json

# Create sample data for testing
df = pd.DataFrame({
    'product': ['A', 'B', 'C', 'D', 'E'],
    'sales': [100, 150, 120, 180, 90],
    'profit': [20, 30, 25, 35, 18]
})

print("Sample data created:")
print(df.to_string())

# Create a simple plotly chart
try:
    import plotly.express as px
    
    fig = px.bar(df, x='product', y='sales', title='Product Sales Analysis')
    
    print("\nChart data:")
    print("```json")
    print(json.dumps(fig.to_dict(), indent=2))
    print("```")
    
except ImportError:
    print("Plotly not available, showing data summary instead")
    print(df.describe().to_string())
