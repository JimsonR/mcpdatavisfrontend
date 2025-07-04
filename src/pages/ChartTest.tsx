import SmartChart from '../components/SmartChart'

export default function ChartTest() {
  // Test data that matches your MCP tool output format
  const histogramData = {
    "type": "histogram",
    "data": [100, 200, 150, 300, 250, 180, 220, 190, 280, 160, 400, 350, 120, 170],
    "title": "Distribution of SALES",
    "column": "SALES"
  }

  const lineData = {
    "type": "line",
    "data": [
      "2/24/2003 0:00",
      "5/7/2003 0:00", 
      "7/1/2003 0:00",
      "8/25/2003 0:00",
      "10/10/2003 0:00",
      "10/28/2003 0:00",
      "11/11/2003 0:00",
      "11/18/2003 0:00",
      "12/1/2003 0:00"
    ],
    "title": "ORDERDATE Over Time",
    "column": "ORDERDATE"
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Chart Testing</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Histogram Test (should render as bar chart)</h2>
          <div className="border border-gray-200 rounded-lg p-4">
            <SmartChart chartData={histogramData} height={300} />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Line Chart with Dates Test</h2>
          <div className="border border-gray-200 rounded-lg p-4">
            <SmartChart chartData={lineData} height={300} />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Raw Data (for debugging)</h2>
          <details className="bg-gray-100 p-4 rounded-lg">
            <summary className="cursor-pointer font-medium">Show Raw Data</summary>
            <pre className="mt-2 text-sm overflow-x-auto">
              <strong>Histogram Data:</strong>
              {JSON.stringify(histogramData, null, 2)}
              
              <strong>Line Data:</strong>
              {JSON.stringify(lineData, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  )
}
