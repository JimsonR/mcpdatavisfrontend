import { BarChart3, LineChart, PieChart, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import SmartChart from '../components/SmartChart'

export default function ChartDemo() {
  const [selectedChart, setSelectedChart] = useState<string>('line')

  // Sample data for different chart types
  const chartExamples = {
    line: {
      type: 'line',
      title: 'Sales Over Time',
      x_label: 'Month',
      y_label: 'Sales ($)',
      data: [
        { x: '2024-01', y: 12500 },
        { x: '2024-02', y: 15600 },
        { x: '2024-03', y: 13200 },
        { x: '2024-04', y: 18900 },
        { x: '2024-05', y: 16800 },
        { x: '2024-06', y: 21300 }
      ]
    },
    bar: {
      type: 'bar',
      title: 'Sales by Category',
      x_label: 'Category',
      y_label: 'Sales ($)',
      data: [
        { label: 'Electronics', value: 45200 },
        { label: 'Clothing', value: 32100 },
        { label: 'Books', value: 18900 },
        { label: 'Home', value: 29250 }
      ]
    },
    pie: {
      type: 'pie',
      title: 'Sales by Region',
      data: [
        { label: 'North', value: 35 },
        { label: 'South', value: 28 },
        { label: 'East', value: 22 },
        { label: 'West', value: 15 }
      ]
    },
    scatter: {
      type: 'scatter',
      title: 'Price vs Sales Volume',
      x_label: 'Price ($)',
      y_label: 'Volume',
      data: [
        { x: 10, y: 100 },
        { x: 20, y: 85 },
        { x: 30, y: 70 },
        { x: 40, y: 55 },
        { x: 50, y: 40 }
      ]
    },
    area: {
      type: 'area',
      title: 'Cumulative Revenue',
      x_label: 'Quarter',
      y_label: 'Revenue ($)',
      data: [
        { x: 'Q1', y: 25000 },
        { x: 'Q2', y: 47000 },
        { x: 'Q3', y: 72000 },
        { x: 'Q4', y: 98000 }
      ]
    }
  }

  const chartButtons = [
    { key: 'line', label: 'Line Chart', icon: LineChart },
    { key: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { key: 'pie', label: 'Pie Chart', icon: PieChart },
    { key: 'scatter', label: 'Scatter Plot', icon: TrendingUp },
    { key: 'area', label: 'Area Chart', icon: TrendingUp }
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Chart Visualization Demo</h1>
        <p className="text-gray-600 mb-4">
          This demonstrates the SmartChart component with Recharts integration for faster, lighter visualizations.
        </p>
        
        {/* Chart type selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {chartButtons.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedChart(key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                selectedChart === key
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart display */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <SmartChart 
          chartData={chartExamples[selectedChart as keyof typeof chartExamples]}
          height={400}
          preferRecharts={true}
        />
      </div>

      {/* Usage instructions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 text-blue-800">For Data Science Scripts</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>Return chart data in this format:</p>
            <pre className="bg-blue-100 p-2 rounded text-xs overflow-x-auto">
{`{
  "type": "line",
  "title": "My Chart",
  "x_label": "Time",
  "y_label": "Value",
  "data": [
    {"x": "2024-01", "y": 100},
    {"x": "2024-02", "y": 150}
  ]
}`}
            </pre>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 text-green-800">Supported Chart Types</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• <strong>line</strong>: Time series, trends</li>
            <li>• <strong>bar</strong>: Categories, comparisons</li>
            <li>• <strong>pie</strong>: Parts of a whole</li>
            <li>• <strong>scatter</strong>: Correlations</li>
            <li>• <strong>area</strong>: Cumulative data</li>
          </ul>
        </div>
      </div>

      {/* Backend integration example */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Backend Integration Example</h3>
        <p className="text-sm text-gray-600 mb-2">
          Your MCP server can return visualization data like this:
        </p>
        <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{`# In your run_script tool
import json

# Process your DataFrame
df_grouped = df.groupby('category')['sales'].sum()

# Create visualization data
chart_data = {
    "type": "bar",
    "title": "Sales by Category",
    "x_label": "Category", 
    "y_label": "Sales ($)",
    "data": [
        {"label": cat, "value": val} 
        for cat, val in df_grouped.items()
    ]
}

# Return as JSON in your response
print("\`\`\`recharts")
print(json.dumps(chart_data, indent=2))
print("\`\`\`")`}
        </pre>
      </div>
    </div>
  )
}
