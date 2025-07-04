import { Maximize2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Plot from 'react-plotly.js'
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis, YAxis
} from 'recharts'

interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'histogram' | 'plotly'
  data: any[]
  title?: string
  x_label?: string
  y_label?: string
  column?: string
  plotly_data?: any
  plotly_layout?: any
}

interface SmartChartProps {
  chartData: ChartData | any
  className?: string
  height?: number
  preferRecharts?: boolean
}

export default function SmartChart({ 
  chartData, 
  className = '', 
  height = 300,
  preferRecharts = true 
}: SmartChartProps) {
  const [showDebug, setShowDebug] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Handle escape key to close fullscreen
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    
    if (isFullscreen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when fullscreen is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isFullscreen])
  
  // Enhanced color palettes for different data contexts
  const COLOR_SCHEMES = {
    default: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'],
    business: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f'],
    pastel: ['#FFB6C1', '#87CEEB', '#DDA0DD', '#98FB98', '#F0E68C', '#FFE4B5', '#FFA07A', '#20B2AA'],
    vibrant: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'],
    professional: ['#2E86AB', '#A23B72', '#F18F01', '#C73E1D', '#593E2A', '#7A306C', '#03A688', '#8C7853'],
    gradient: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'],
    dark: ['#1e3a8a', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#374151'],
    scientific: ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600']
  }

  // Smart number formatting function with more advanced formatting
  const formatNumber = (value: number): string => {
    if (Math.abs(value) >= 1000000000) return (value / 1000000000).toFixed(1) + 'B'
    if (Math.abs(value) >= 1000000) return (value / 1000000).toFixed(1) + 'M'
    if (Math.abs(value) >= 1000) return (value / 1000).toFixed(1) + 'K'
    if (value % 1 === 0) return value.toString()
    return value.toFixed(2)
  }

  // Smart color selection based on data type and context
  const getColorScheme = (chartData: any): string[] => {
    // Financial/business data
    if (chartData?.column?.toLowerCase().includes('sales') || 
        chartData?.column?.toLowerCase().includes('revenue') ||
        chartData?.column?.toLowerCase().includes('profit') ||
        chartData?.column?.toLowerCase().includes('price')) {
      return COLOR_SCHEMES.business
    }
    
    // Scientific/technical data
    if (chartData?.column?.toLowerCase().includes('temperature') ||
        chartData?.column?.toLowerCase().includes('measurement') ||
        chartData?.column?.toLowerCase().includes('score')) {
      return COLOR_SCHEMES.scientific
    }
    
    // Performance data
    if (chartData?.column?.toLowerCase().includes('performance') ||
        chartData?.column?.toLowerCase().includes('efficiency') ||
        chartData?.column?.toLowerCase().includes('speed')) {
      return COLOR_SCHEMES.gradient
    }
    
    // Dark theme detection
    if (document.documentElement.classList.contains('dark') || 
        window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return COLOR_SCHEMES.dark
    }
    
    // Chart type specific
    if (chartData?.type === 'pie') {
      return COLOR_SCHEMES.pastel
    }
    
    // Large datasets get professional colors
    if (chartData?.data?.length > 10) {
      return COLOR_SCHEMES.professional
    }
    
    // Enhanced styling hint from backend
    if (chartData?.styling?.color_scheme) {
      return COLOR_SCHEMES[chartData.styling.color_scheme as keyof typeof COLOR_SCHEMES] || COLOR_SCHEMES.default
    }
    
    return COLOR_SCHEMES.vibrant
  }
  
  // Process simple chart data from your MCP tool
  const processSimpleChartData = (data: any) => {
    switch (data.type) {
      case 'histogram':
        // Convert histogram data to bar chart format
        const counts: { [key: string]: number } = {}
        
        // Process the data to create buckets
        data.data.forEach((value: any) => {
          let numValue: number
          
          // Handle different data types
          if (typeof value === 'string') {
            // Try to parse as number first
            numValue = parseFloat(value)
            if (isNaN(numValue)) {
              // If not a number, use the string as a category
              counts[value] = (counts[value] || 0) + 1
              return
            }
          } else if (typeof value === 'number') {
            numValue = value
          } else {
            // Default to 0 for other types
            numValue = 0
          }
          
          // Create buckets for numeric data
          const bucketSize = Math.max(1, Math.floor(Math.abs(numValue) / 10) || 1)
          const bucket = Math.floor(numValue / bucketSize) * bucketSize
          const key = `${bucket}-${bucket + bucketSize}`
          counts[key] = (counts[key] || 0) + 1
        })
        
        return {
          type: 'bar',
          title: data.title || `Distribution of ${data.column}`,
          x_label: data.column || 'Value Range',
          y_label: 'Frequency',
          data: Object.entries(counts).map(([range, count]) => ({
            label: range,
            value: count
          }))
        }

      case 'line':
        // Convert line data to proper format
        if (Array.isArray(data.data)) {
          // Check if data contains dates
          const isDateData = data.data.some((value: any) => {
            if (typeof value === 'string') {
              // Check for date patterns like "2/24/2003 0:00"
              return /^\d{1,2}\/\d{1,2}\/\d{4}/.test(value) || !isNaN(Date.parse(value))
            }
            return false
          })

          if (isDateData) {
            // Handle date data - convert to simplified format for visualization
            return {
              type: 'line',
              title: data.title || `${data.column} Over Time`,
              x_label: 'Time Period',
              y_label: 'Count',
              data: data.data.map((value: any, _index: number) => {
                let displayValue = value
                if (typeof value === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}/.test(value)) {
                  // Convert date to a simpler format for display
                  const date = new Date(value)
                  displayValue = date.getFullYear().toString()
                }
                return {
                  x: displayValue,
                  y: 1, // Count of 1 for each data point
                  label: displayValue
                }
              })
            }
          } else {
            // Handle numeric or other data
            return {
              type: 'line',
              title: data.title || `${data.column} Over Time`,
              x_label: 'Index',
              y_label: data.column || 'Value',
              data: data.data.map((value: any, index: number) => ({
                x: index + 1,
                y: typeof value === 'number' ? value : parseFloat(value) || index,
                label: value
              }))
            }
          }
        }
        break

      case 'bar':
        // Already in correct format, just ensure proper structure
        return {
          type: 'bar',
          title: data.title || `${data.column} Analysis`,
          x_label: data.x_label || 'Category',
          y_label: data.y_label || 'Value',
          data: data.data
        }

      case 'pie':
        // Already in correct format
        return {
          type: 'pie',
          title: data.title || `${data.column} Distribution`,
          data: data.data
        }

      default:
        return data
    }
    
    return data
  }

  // Process and detect chart data format
  const processedChartData = useMemo(() => {
    try {
      // If it's already structured chart data, check if it needs processing
      if (chartData?.type && chartData?.data) {
        // Check if it's an MCP simple chart that needs processing
        if (['histogram', 'line', 'bar', 'pie'].includes(chartData.type) && 
            (chartData.column || chartData.title)) {
          return processSimpleChartData(chartData)
        }
        // Otherwise return as-is for already processed data
        return chartData
      }

      // Try to detect your MCP tool's format (create_simple_chart output)
      if (typeof chartData === 'string') {
        try {
          const parsed = JSON.parse(chartData)
          if (parsed.type && parsed.data) {
            return processSimpleChartData(parsed)
          }
        } catch (e) {
          // Not JSON, continue with other detection
        }
      }

      // Try to detect Plotly format
      if (chartData?.data || Array.isArray(chartData)) {
        return {
          type: 'plotly',
          plotly_data: chartData?.data || chartData,
          plotly_layout: chartData?.layout || {}
        }
      }

      // Try to auto-detect from DataFrame-like structure
      if (typeof chartData === 'object' && chartData !== null) {
        // Look for common patterns in the data
        const keys = Object.keys(chartData)
        
        if (keys.includes('plots') && Array.isArray(chartData.plots)) {
          // Multiple plots - return the first one for now
          return chartData.plots[0]
        }

        // Single chart data
        if (keys.includes('x') && keys.includes('y')) {
          return {
            type: 'line',
            data: Array.isArray(chartData.x) ? 
              chartData.x.map((x: any, i: number) => ({ x, y: chartData.y[i] })) : 
              [{ x: chartData.x, y: chartData.y }],
            title: chartData.title || 'Chart'
          }
        }

        // Direct MCP tool format
        if (keys.includes('type') && keys.includes('data')) {
          return processSimpleChartData(chartData)
        }
      }

      return null
    } catch (error) {
      console.error('Error processing chart data:', error)
      return null
    }
  }, [chartData])

  // Get smart colors based on processed chart data
  const COLORS = useMemo(() => getColorScheme(processedChartData || chartData), [processedChartData, chartData])

  // Enhanced custom tooltip for better formatting
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`${label || 'Value'}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name || entry.dataKey || 'Value'}: ${
                typeof entry.value === 'number' 
                  ? formatNumber(entry.value) 
                  : entry.value || 'N/A'
              }`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Render Recharts-based visualization
  const renderRechartsChart = (chart: ChartData, isFullscreenMode = false) => {
    const chartHeight = isFullscreenMode ? 600 : height // Use fixed height for fullscreen
    const containerProps = {
      width: "100%",
      height: chartHeight
    }

    switch (chart.type) {
      case 'line':
        return (
          <ResponsiveContainer {...containerProps}>
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="x" 
                label={{ value: chart.x_label, position: 'insideBottom', offset: -10 }}
                tickFormatter={(value) => typeof value === 'string' ? value : formatNumber(value)}
              />
              <YAxis 
                label={{ value: chart.y_label, angle: -90, position: 'insideLeft' }}
                tickFormatter={formatNumber}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="y" 
                stroke={COLORS[0]} 
                strokeWidth={2}
                dot={{ fill: COLORS[0], strokeWidth: 2, r: 4 }}
                name={chart.y_label || 'Value'}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer {...containerProps}>
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="label" 
                label={{ value: chart.x_label, position: 'insideBottom', offset: -10 }}
                angle={chart.data?.length > 5 ? -45 : 0}
                textAnchor={chart.data?.length > 5 ? 'end' : 'middle'}
                height={chart.data?.length > 5 ? 80 : 60}
              />
              <YAxis 
                label={{ value: chart.y_label, angle: -90, position: 'insideLeft' }}
                tickFormatter={formatNumber}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="value" 
                fill={COLORS[0]}
                name={chart.y_label || 'Value'}
              />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer {...containerProps}>
            <PieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ label, percent }: any) => `${label} ${((percent || 0) * 100).toFixed(1)}%`}
                outerRadius={Math.min(height * 0.3, 120)}
                fill="#8884d8"
                dataKey="value"
              >
                {chart.data.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'scatter':
        return (
          <ResponsiveContainer {...containerProps}>
            <ScatterChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="x" 
                label={{ value: chart.x_label, position: 'insideBottom', offset: -10 }}
                tickFormatter={(value) => typeof value === 'string' ? value : formatNumber(value)}
              />
              <YAxis 
                dataKey="y"
                label={{ value: chart.y_label, angle: -90, position: 'insideLeft' }}
                tickFormatter={formatNumber}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter 
                fill={COLORS[0]}
                name={`${chart.x_label || 'X'} vs ${chart.y_label || 'Y'}`}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer {...containerProps}>
            <AreaChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="x" 
                label={{ value: chart.x_label, position: 'insideBottom', offset: -10 }}
                tickFormatter={(value) => typeof value === 'string' ? value : formatNumber(value)}
              />
              <YAxis 
                label={{ value: chart.y_label, angle: -90, position: 'insideLeft' }}
                tickFormatter={formatNumber}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="y" 
                stroke={COLORS[0]} 
                fill={COLORS[0]}
                fillOpacity={0.6}
                name={chart.y_label || 'Value'}
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      default:
        return (
          <div className="p-4 border border-orange-200 bg-orange-50 rounded-md">
            <p className="text-orange-700 text-sm">
              Unsupported Recharts chart type: {chart.type}
            </p>
          </div>
        )
    }
  }

  // Render Plotly chart
  const renderPlotlyChart = (chart: ChartData, isFullscreenMode = false) => {
    try {
      const plotHeight = isFullscreenMode ? "calc(100vh - 200px)" : `${height}px`
      
      return (
        <Plot
          data={chart.plotly_data}
          layout={{
            autosize: true,
            margin: { l: 50, r: 50, t: 50, b: 50 },
            paper_bgcolor: 'white',
            plot_bgcolor: 'white',
            font: { family: 'Inter, system-ui, sans-serif', size: isFullscreenMode ? 14 : 12 },
            showlegend: true,
            hovermode: 'closest',
            ...chart.plotly_layout
          }}
          config={{
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            responsive: true
          }}
          style={{ width: '100%', height: plotHeight }}
          useResizeHandler={true}
        />
      )
    } catch (error) {
      console.error('Error rendering Plotly chart:', error)
      return (
        <div className="p-4 border border-red-200 bg-red-50 rounded-md">
          <p className="text-red-700 text-sm">
            Error rendering Plotly chart: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )
    }
  }

  if (!processedChartData) {
    return (
      <div className="p-4 border border-gray-200 bg-gray-50 rounded-md">
        <p className="text-gray-700 text-sm">No chart data available</p>
        <button 
          onClick={() => setShowDebug(!showDebug)}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800"
        >
          {showDebug ? 'Hide' : 'Show'} Debug Info
        </button>
        {showDebug && (
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
            {JSON.stringify(chartData, null, 2)}
          </pre>
        )}
      </div>
    )
  }

  return (
    <>
      <div className={`smart-chart ${className}`}>
        {processedChartData.title && (
          <h3 className="text-lg font-semibold mb-4 text-center">
            {processedChartData.title}
          </h3>
        )}
        
        <div 
          className="chart-container relative group cursor-pointer"
          onClick={() => setIsFullscreen(true)}
          title="Click to view fullscreen"
        >
          {/* Fullscreen indicator */}
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-black bg-opacity-50 text-white p-1 rounded">
              <Maximize2 className="w-4 h-4" />
            </div>
          </div>
          
          {processedChartData.type === 'plotly' || !preferRecharts ? 
            renderPlotlyChart(processedChartData) : 
            renderRechartsChart(processedChartData)
          }
        </div>

        {/* Debug toggle */}
        <div className="mt-2 flex justify-end">
          <button 
            onClick={(e) => {
              e.stopPropagation()
              setShowDebug(!showDebug)
            }}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Debug
          </button>
        </div>

        {showDebug && (
          <details className="mt-2">
            <summary className="text-xs text-gray-600 cursor-pointer">Chart Data</summary>
            <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
              {JSON.stringify(processedChartData, null, 2)}
            </pre>
          </details>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="w-full h-full max-w-7xl max-h-full p-8 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">
                {processedChartData.title || 'Chart'}
              </h2>
              <button
                onClick={() => setIsFullscreen(false)}
                className="text-white hover:text-gray-300 p-2"
                title="Close fullscreen"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Fullscreen Chart */}
            <div className="flex-1 bg-white rounded-lg p-4">
              {processedChartData.type === 'plotly' || !preferRecharts ? 
                renderPlotlyChart(processedChartData, true) : 
                renderRechartsChart(processedChartData, true)
              }
            </div>
          </div>
        </div>
      )}
    </>
  )
}
