// Test script to validate grouped area chart processing
const testGroupedAreaChart = () => {
  // Sample data in the new backend format
  const backendData = {
    "type": "area",
    "title": "Sales by Product Line",
    "x": "MONTH_ID", 
    "y": "SALES",
    "series_column": "PRODUCT_LINE",
    "series": {
      "Golf Clubs": [
        {"x": "2", "y": 815.51},
        {"x": "5", "y": 2071.49},
        {"x": "7", "y": 936.63}
      ],
      "Product A": [
        {"x": "2", "y": 1456.78},
        {"x": "5", "y": 3122.35},
        {"x": "7", "y": 1789.22}
      ],
      "Product B": [
        {"x": "2", "y": 598.71},
        {"x": "5", "y": 2135.22},
        {"x": "7", "y": 581.92}
      ]
    }
  }

  // Simulate the processing logic from SmartChart
  const processedData = processAreaChartData(backendData)
  
  console.log('Original Data:', JSON.stringify(backendData, null, 2))
  console.log('Processed Data:', JSON.stringify(processedData, null, 2))
  
  return processedData
}

// Simulate the area chart processing logic
const processAreaChartData = (data) => {
  if (data.series && typeof data.series === 'object') {
    const seriesKeys = Object.keys(data.series)
    
    if (seriesKeys.length > 0) {
      // Get all unique x values across all series
      const allXValues = new Set()
      seriesKeys.forEach(seriesKey => {
        const seriesData = data.series[seriesKey]
        if (Array.isArray(seriesData)) {
          seriesData.forEach((point) => allXValues.add(point.x))
        }
      })
      
      // Sort x values for proper ordering
      const sortedXValues = Array.from(allXValues).sort()
      
      // Merge data for stacked area chart
      const mergedData = sortedXValues.map(x => {
        const dataPoint = { x }
        seriesKeys.forEach(seriesKey => {
          const seriesData = data.series[seriesKey]
          const point = seriesData.find((p) => p.x == x) // Use == for flexible comparison
          dataPoint[seriesKey] = point ? (typeof point.y === 'string' ? parseFloat(point.y) : point.y) : 0
        })
        return dataPoint
      })
      
      return {
        type: 'area',
        title: data.title || `Area chart of ${data.y} by ${data.x}${data.series_column ? ` per ${data.series_column}` : ''}`,
        x_label: data.x || 'X',
        y_label: data.y || 'Y',
        data: mergedData,
        series: seriesKeys, // Keep track of series names for rendering
        series_column: data.series_column // Track the grouping column
      }
    }
  }
  
  return data
}

// Run the test
const result = testGroupedAreaChart()
console.log('Test completed!')
console.log('Final merged data points:', result.data?.length || 0)
console.log('Series detected:', result.series?.length || 0)

module.exports = { testGroupedAreaChart, processAreaChartData }
