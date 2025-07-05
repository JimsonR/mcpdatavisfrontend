import SmartChart from '../components/SmartChart'

export default function ChartTest() {
  // New histogram format with bins (your updated backend)
  const newHistogramData = {
    "type": "histogram",
    "bins": [
      {"range": [100, 200], "count": 5},
      {"range": [200, 300], "count": 8},
      {"range": [300, 400], "count": 12},
      {"range": [400, 500], "count": 7},
      {"range": [500, 600], "count": 3}
    ],
    "title": "Distribution of Sales",
    "column": "SALES"
  }

  // New line format with points (your updated backend)
  const newLineData = {
    "type": "line",
    "points": [
      { "x": "2", "y": 2871.0 },
      { "x": "5", "y": 7329.06 },
      { "x": "7", "y": 3307.77 },
      { "x": "10", "y": 4132.7 },
      { "x": "11", "y": 3492.48 }
    ],
    "title": "Monthly Sales Trend",
    "x": "MONTH_ID",
    "y": "SALES"
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Updated Backend Format Testing</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Histogram (bins array)</h2>
          <div className="border border-gray-200 rounded-lg p-4">
            <SmartChart chartData={newHistogramData} height={300} />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Line Chart (points array)</h2>
          <div className="border border-gray-200 rounded-lg p-4">
            <SmartChart chartData={newLineData} height={300} />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Area Chart (multiple series)</h2>
          <div className="border border-gray-200 rounded-lg p-4">
            <SmartChart chartData={{
              "type": "area",
              "title": "Multi-Series Area Chart",
              "x_label": "Quarter",
              "y_label": "Amount ($k)",
              "series": {
                "Revenue": [100, 120, 140, 110, 160, 180],
                "Profit": [30, 40, 50, 35, 60, 70],
                "Expenses": [70, 80, 90, 75, 100, 110]
              },
              "data": [
                {"x": "Q1", "Revenue": 100, "Profit": 30, "Expenses": 70},
                {"x": "Q2", "Revenue": 120, "Profit": 40, "Expenses": 80},
                {"x": "Q3", "Revenue": 140, "Profit": 50, "Expenses": 90},
                {"x": "Q4", "Revenue": 110, "Profit": 35, "Expenses": 75},
                {"x": "Q5", "Revenue": 160, "Profit": 60, "Expenses": 100},
                {"x": "Q6", "Revenue": 180, "Profit": 70, "Expenses": 110}
              ]
            }} height={300} />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">JSON String Test (exact tool output)</h2>
          <div className="border border-gray-200 rounded-lg p-4">
            <SmartChart 
              chartData={JSON.stringify(newLineData, null, 2)} 
              height={300} 
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            This simulates your create_visualization tool output exactly
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Debug Info</h2>
          <details className="bg-gray-100 p-4 rounded-lg">
            <summary className="cursor-pointer font-medium">Show Raw Data Formats</summary>
            <div className="mt-2 space-y-4">
              <div>
                <strong>Histogram Format:</strong>
                <pre className="text-xs mt-1 p-2 bg-white rounded overflow-x-auto">
{JSON.stringify(newHistogramData, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Line Format:</strong>
                <pre className="text-xs mt-1 p-2 bg-white rounded overflow-x-auto">
{JSON.stringify(newLineData, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
