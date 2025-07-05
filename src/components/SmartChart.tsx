import { Download, Maximize2, Move, RotateCcw, Settings, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
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
  series?: { [key: string]: any[] } | string[] // For area charts with multiple y-series
  series_column?: string // For grouped area charts (the column used for grouping)
  x?: string
  y?: string | string[]
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
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showControls, setShowControls] = useState(false)
  const [panEnabled, setPanEnabled] = useState(false)
  const [zoomDomain, setZoomDomain] = useState<any>(null)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const chartRef = useRef<any>(null)
  
  // Zoom and interaction functions
  const handleZoomIn = () => {
    if (processedChartData?.type === 'plotly') {
      // For Plotly, we'll let it handle zoom natively
      setZoomLevel(prev => Math.min(prev * 1.2, 5))
    } else {
      // For Recharts, we need to adjust the data domain
      const newZoom = Math.min(zoomLevel * 1.2, 5)
      setZoomLevel(newZoom)
      updateChartDomain(newZoom)
    }
  }
  
  const handleZoomOut = () => {
    if (processedChartData?.type === 'plotly') {
      setZoomLevel(prev => Math.max(prev / 1.2, 0.5))
    } else {
      const newZoom = Math.max(zoomLevel / 1.2, 0.5)
      setZoomLevel(newZoom)
      updateChartDomain(newZoom)
    }
  }
  
  const handleResetZoom = () => {
    setZoomLevel(1)
    setZoomDomain(null)
    setPanOffset({ x: 0, y: 0 })
  }
  
  const handlePanStart = (event: React.MouseEvent) => {
    if (!panEnabled) return
    setIsDragging(true)
    setDragStart({ x: event.clientX, y: event.clientY })
  }
  
  const handlePanMove = (event: React.MouseEvent) => {
    if (!panEnabled || !isDragging) return
    
    const deltaX = event.clientX - dragStart.x
    const deltaY = event.clientY - dragStart.y
    
    // Convert pixel movement to percentage of data range
    const panSensitivity = 0.5
    const newPanOffset = {
      x: panOffset.x + deltaX * panSensitivity, // Positive delta = move right
      y: panOffset.y - deltaY * panSensitivity // Negative delta for natural feel (up = positive)
    }
    
    // Limit pan range to reasonable bounds
    newPanOffset.x = Math.max(-200, Math.min(200, newPanOffset.x))
    newPanOffset.y = Math.max(-200, Math.min(200, newPanOffset.y))
    
    setPanOffset(newPanOffset)
    setDragStart({ x: event.clientX, y: event.clientY })
    updateChartDomain(zoomLevel, newPanOffset.x, newPanOffset.y)
  }
  
  const handlePanEnd = () => {
    setIsDragging(false)
  }
  
  const updateChartDomain = (zoom: number, panOffsetX = panOffset.x, panOffsetY = panOffset.y) => {
    if (!processedChartData?.data) return
    
    const data = processedChartData.data
    if (data.length === 0) return
    
    // Calculate center point for zoom with pan offset
    const totalPoints = data.length
    const visiblePoints = Math.max(Math.floor(totalPoints / zoom), 5)
    
    // Calculate pan offset based on data range
    const panFactorX = panOffsetX / 100 // Convert percentage to factor
    
    // Calculate visible window with pan offset
    const baseCenterIndex = Math.floor(totalPoints / 2)
    const panOffsetPoints = Math.floor(panFactorX * totalPoints)
    const centerIndex = Math.max(0, Math.min(totalPoints - 1, baseCenterIndex + panOffsetPoints))
    
    const startIndex = Math.max(0, Math.min(totalPoints - visiblePoints, centerIndex - Math.floor(visiblePoints / 2)))
    const endIndex = Math.min(totalPoints - 1, startIndex + visiblePoints)
    
    // For different chart types, handle domain differently
    if (['line', 'area', 'scatter'].includes(processedChartData.type)) {
      const visibleData = data.slice(startIndex, endIndex)
      if (visibleData.length > 0) {
        const xValues = visibleData.map((d: any) => d.x)
        const yValues = visibleData.flatMap((d: any) => {
          // Handle both single y values and multi-series data
          if (typeof d.y === 'number') return [d.y]
          // For multi-series area charts, get all series values
          const seriesValues = Object.keys(d).filter(key => key !== 'x' && typeof d[key] === 'number').map(key => d[key])
          return seriesValues.length > 0 ? seriesValues : [0]
        })
        
        // Apply pan offset to y-axis as well
        const yMin = Math.min(...yValues)
        const yMax = Math.max(...yValues)
        const yRange = yMax - yMin
        const yPanOffset = (panOffsetY / 100) * yRange
        
        setZoomDomain({
          x: [Math.min(...xValues), Math.max(...xValues)],
          y: [yMin + yPanOffset, yMax + yPanOffset]
        })
      }
    } else if (processedChartData.type === 'bar') {
      const visibleData = data.slice(startIndex, endIndex)
      if (visibleData.length > 0) {
        const values = visibleData.map((d: any) => d.value || 0)
        const maxValue = Math.max(...values)
        const yPanOffset = (panOffsetY / 100) * maxValue
        setZoomDomain({
          y: [Math.max(0, yPanOffset), maxValue * 1.1 + yPanOffset] // Add 10% padding
        })
      }
    }
  }
  
  const togglePan = () => {
    setPanEnabled(!panEnabled)
  }
  
  const downloadChart = () => {
    if (chartRef.current) {
      // For Plotly charts, use built-in download
      if (processedChartData?.type === 'plotly') {
        // Plotly has built-in download functionality
        return
      }
      
      // For Recharts, we'll implement a basic screenshot functionality
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const chartElement = chartRef.current
      
      // This is a simplified implementation - in production you might want to use html2canvas
      if (ctx && chartElement) {
        canvas.width = chartElement.offsetWidth
        canvas.height = chartElement.offsetHeight
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        const link = document.createElement('a')
        link.download = `chart-${Date.now()}.png`
        link.href = canvas.toDataURL()
        link.click()
      }
    }
  }
  
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
        // Handle new histogram format with bins array
        if (Array.isArray(data.data) && data.data.length > 0 && data.data[0].range && data.data[0].count !== undefined) {
          // New format: bins array with range and count
          return {
            type: 'bar',
            title: data.title || `Distribution of ${data.column}`,
            x_label: data.column || 'Value Range',
            y_label: 'Frequency',
            data: data.data.map((bin: any) => ({
              label: `${bin.range[0].toFixed(1)}-${bin.range[1].toFixed(1)}`,
              value: bin.count
            }))
          }
        } else {
          // Legacy format: Convert histogram data to bar chart format
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
        }

      case 'line':
        // Convert line data to proper format
        if (Array.isArray(data.data)) {
          // Check if data is already in {x, y} format (new tool format)
          if (data.data.length > 0 && typeof data.data[0] === 'object' && 
              data.data[0].hasOwnProperty('x') && data.data[0].hasOwnProperty('y')) {
            // Data is already in correct format, just ensure proper structure
            return {
              type: 'line',
              title: data.title || 'Line Chart',
              x_label: data.x_label || 'X',
              y_label: data.y_label || 'Y',
              data: data.data.map((point: any) => ({
                x: point.x,
                y: typeof point.y === 'string' ? parseFloat(point.y) : point.y,
                label: `${point.x}: ${point.y}`
              }))
            }
          }
          
          // Legacy format: check if data contains dates
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
        // Handle new bar format with bars array
        if (Array.isArray(data.data) && data.data.length > 0 && data.data[0].label !== undefined && data.data[0].value !== undefined) {
          // New format: bars array with label and value
          return {
            type: 'bar',
            title: data.title || `${data.y} by ${data.x}`,
            x_label: data.x || 'Category',
            y_label: data.y || 'Value',
            data: data.data
          }
        } else {
          // Legacy format: already in correct format, just ensure proper structure
          return {
            type: 'bar',
            title: data.title || `${data.column} Analysis`,
            x_label: data.x_label || 'Category',
            y_label: data.y_label || 'Value',
            data: data.data
          }
        }

      case 'pie':
        // Handle new pie format with slices array
        if (Array.isArray(data.data) && data.data.length > 0 && data.data[0].label !== undefined && data.data[0].value !== undefined) {
          // New format: slices array with label and value
          return {
            type: 'pie',
            title: data.title || `${data.column} Distribution`,
            data: data.data
          }
        } else {
          // Legacy format: already in correct format
          return {
            type: 'pie',
            title: data.title || `${data.column} Distribution`,
            data: data.data
          }
        }

      case 'scatter':
        // Handle scatter plot with points array
        if (Array.isArray(data.data) && data.data.length > 0 && 
            typeof data.data[0] === 'object' && 
            data.data[0].hasOwnProperty('x') && data.data[0].hasOwnProperty('y')) {
          // Data is in {x, y} format
          return {
            type: 'scatter',
            title: data.title || `${data.y} vs ${data.x}`,
            x_label: data.x || 'X',
            y_label: data.y || 'Y',
            data: data.data.map((point: any) => ({
              x: typeof point.x === 'string' ? parseFloat(point.x) || point.x : point.x,
              y: typeof point.y === 'string' ? parseFloat(point.y) : point.y,
              label: `${point.x}: ${point.y}`
            }))
          }
        }
        break

      case 'area':
        // Handle area chart with series object
        if (typeof data.data === 'object' && !Array.isArray(data.data)) {
          // New format: series object with multiple y columns
          const seriesKeys = Object.keys(data.data)
          
          if (seriesKeys.length > 0) {
            const firstSeries = seriesKeys[0]
            const firstSeriesData = data.data[firstSeries]
            
            if (Array.isArray(firstSeriesData) && firstSeriesData.length > 0 &&
                typeof firstSeriesData[0] === 'object' &&
                firstSeriesData[0].hasOwnProperty('x') && firstSeriesData[0].hasOwnProperty('y')) {
              
              // Handle multiple series for area chart
              if (seriesKeys.length === 1) {
                // Single series - use standard area chart
                return {
                  type: 'area',
                  title: data.title || `Area chart of ${data.y} by ${data.x}`,
                  x_label: data.x || 'X',
                  y_label: data.y || 'Y',
                  data: firstSeriesData.map((point: any) => ({
                    x: typeof point.x === 'string' ? parseFloat(point.x) || point.x : point.x,
                    y: typeof point.y === 'string' ? parseFloat(point.y) : point.y,
                    label: `${point.x}: ${point.y}`
                  }))
                }
              } else {
                // Multiple series - merge data for stacked area chart
                const allXValues = [...new Set(firstSeriesData.map((point: any) => point.x))]
                const mergedData = allXValues.map(x => {
                  const dataPoint: any = { x }
                  seriesKeys.forEach(seriesKey => {
                    const seriesData = data.data[seriesKey]
                    const point = seriesData.find((p: any) => p.x === x)
                    dataPoint[seriesKey] = point ? (typeof point.y === 'string' ? parseFloat(point.y) : point.y) : 0
                  })
                  return dataPoint
                })
                
                return {
                  type: 'area',
                  title: data.title || `Area chart of ${data.y} by ${data.x}`,
                  x_label: data.x || 'X',
                  y_label: data.y || 'Y',
                  data: mergedData,
                  series: seriesKeys, // Keep track of series names for rendering
                  series_column: data.series_column // Track the grouping column
                }
              }
            }
          }
        }
        // Handle direct series format from new backend
        else if (data.series && typeof data.series === 'object') {
          // New grouped area chart format: {series: {ProductLine1: [{x, y}], ProductLine2: [{x, y}]}}
          const seriesKeys = Object.keys(data.series)
          
          if (seriesKeys.length > 0) {
            // Get all unique x values across all series
            const allXValues = new Set()
            seriesKeys.forEach(seriesKey => {
              const seriesData = data.series[seriesKey]
              if (Array.isArray(seriesData)) {
                seriesData.forEach((point: any) => allXValues.add(point.x))
              }
            })
            
            // Sort x values for proper ordering
            const sortedXValues = Array.from(allXValues).sort()
            
            // Merge data for stacked area chart
            const mergedData = sortedXValues.map(x => {
              const dataPoint: any = { x }
              seriesKeys.forEach(seriesKey => {
                const seriesData = data.series[seriesKey]
                const point = seriesData.find((p: any) => p.x == x) // Use == for flexible comparison
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
        break

      default:
        return data
    }
    
    return data
  }

  // Process and detect chart data format
  const processedChartData = useMemo(() => {
    try {
      // If it's already structured chart data, check if it needs processing
      if (chartData?.type && (chartData?.data || chartData?.points || chartData?.bins || chartData?.bars || chartData?.slices || chartData?.series)) {
        // Handle the new formats with different array names
        const dataToProcess = {
          ...chartData,
          data: chartData.data || chartData.points || chartData.bins || chartData.bars || chartData.slices || chartData.series
        }
        
        // Check if it's an MCP simple chart that needs processing
        if (['histogram', 'line', 'bar', 'pie', 'scatter', 'area'].includes(chartData.type) && 
            (chartData.column || chartData.title || chartData.x || chartData.y)) {
          return processSimpleChartData(dataToProcess)
        }
        // Otherwise return as-is for already processed data
        return dataToProcess
      }

      // Try to detect your MCP tool's format (create_simple_chart output)
      if (typeof chartData === 'string') {
        try {
          const parsed = JSON.parse(chartData)
          if (parsed.type && (parsed.data || parsed.points || parsed.bins || parsed.bars || parsed.slices || parsed.series)) {
            // Normalize the data structure
            const normalizedData = {
              ...parsed,
              data: parsed.data || parsed.points || parsed.bins || parsed.bars || parsed.slices || parsed.series
            }
            return processSimpleChartData(normalizedData)
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

  // Render Recharts-based visualization with zoom and pan
  const renderRechartsChart = (chart: ChartData, isFullscreenMode = false) => {
    const chartHeight = isFullscreenMode ? 600 : height // Use fixed height for fullscreen
    const containerProps = {
      width: "100%",
      height: chartHeight
    }

    // Enhanced chart props with zoom and pan (removed CSS transform)
    const enhancedChartProps = {
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    }
    
    // Get the data to display based on zoom level and pan offset
    const getDisplayData = () => {
      if (zoomLevel === 1 && panOffset.x === 0) return chart.data
      
      const data = chart.data
      if (!data || data.length === 0) return data
      
      // For zoom and pan, calculate visible data window
      const totalPoints = data.length
      const visiblePoints = Math.max(Math.floor(totalPoints / zoomLevel), 5) // Minimum 5 points
      
      // Calculate pan offset in data points
      const panFactorX = panOffset.x / 100 // Convert percentage to factor
      const baseCenterIndex = Math.floor(totalPoints / 2)
      const panOffsetPoints = Math.floor(panFactorX * totalPoints)
      const centerIndex = Math.max(0, Math.min(totalPoints - 1, baseCenterIndex + panOffsetPoints))
      
      const startIndex = Math.max(0, Math.min(totalPoints - visiblePoints, centerIndex - Math.floor(visiblePoints / 2)))
      const endIndex = Math.min(totalPoints, startIndex + visiblePoints)
      
      return data.slice(startIndex, endIndex)
    }
    
    const displayData = getDisplayData()

    switch (chart.type) {
      case 'line':
        return (
          <ResponsiveContainer {...containerProps}>
            <LineChart 
              data={displayData}
              {...enhancedChartProps}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="x" 
                label={{ value: chart.x_label, position: 'insideBottom', offset: -10 }}
                tickFormatter={(value) => typeof value === 'string' ? value : formatNumber(value)}
                domain={zoomDomain?.x || ['dataMin', 'dataMax']}
                type={typeof displayData[0]?.x === 'number' ? 'number' : 'category'}
                allowDataOverflow={true}
              />
              <YAxis 
                label={{ value: chart.y_label, angle: -90, position: 'insideLeft' }}
                tickFormatter={formatNumber}
                domain={zoomDomain?.y || ['dataMin', 'dataMax']}
                allowDataOverflow={true}
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
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer {...containerProps}>
            <BarChart data={displayData} {...enhancedChartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="label" 
                label={{ value: chart.x_label, position: 'insideBottom', offset: -10 }}
                angle={displayData?.length > 5 ? -45 : 0}
                textAnchor={displayData?.length > 5 ? 'end' : 'middle'}
                height={displayData?.length > 5 ? 80 : 60}
                type="category"
              />
              <YAxis 
                label={{ value: chart.y_label, angle: -90, position: 'insideLeft' }}
                tickFormatter={formatNumber}
                domain={zoomDomain?.y || ['dataMin', 'dataMax']}
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
                outerRadius={Math.min(height * 0.3 * zoomLevel, 120 * zoomLevel)}
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
            <ScatterChart data={displayData} {...enhancedChartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="x" 
                label={{ value: chart.x_label, position: 'insideBottom', offset: -10 }}
                tickFormatter={(value) => typeof value === 'string' ? value : formatNumber(value)}
                domain={zoomDomain?.x || ['dataMin', 'dataMax']}
                type={typeof displayData[0]?.x === 'number' ? 'number' : 'category'}
              />
              <YAxis 
                dataKey="y"
                label={{ value: chart.y_label, angle: -90, position: 'insideLeft' }}
                tickFormatter={formatNumber}
                domain={zoomDomain?.y || ['dataMin', 'dataMax']}
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
            <AreaChart data={displayData} {...enhancedChartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="x" 
                label={{ value: chart.x_label, position: 'insideBottom', offset: -10 }}
                tickFormatter={(value) => typeof value === 'string' ? value : formatNumber(value)}
                domain={zoomDomain?.x || ['dataMin', 'dataMax']}
                type={typeof displayData[0]?.x === 'number' ? 'number' : 'category'}
              />
              <YAxis 
                label={{ value: chart.y_label, angle: -90, position: 'insideLeft' }}
                tickFormatter={formatNumber}
                domain={zoomDomain?.y || ['dataMin', 'dataMax']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {chart.series && (Array.isArray(chart.series) ? chart.series.length > 1 : Object.keys(chart.series).length > 1) ? (
                // Multiple series - render each as separate area
                (Array.isArray(chart.series) ? chart.series : Object.keys(chart.series)).map((seriesName: string, index: number) => (
                  <Area 
                    key={seriesName}
                    type="monotone" 
                    dataKey={seriesName}
                    stackId="1"
                    stroke={COLORS[index % COLORS.length]} 
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={0.6}
                    name={seriesName}
                  />
                ))
              ) : (
                // Single series
                <Area 
                  type="monotone" 
                  dataKey="y" 
                  stroke={COLORS[0]} 
                  fill={COLORS[0]}
                  fillOpacity={0.6}
                  name={chart.y_label || 'Value'}
                />
              )}
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

  // Render Plotly chart with enhanced features
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
            dragmode: panEnabled ? 'pan' : 'zoom',
            scrollZoom: true,
            doubleClick: 'reset+autosize',
            ...chart.plotly_layout
          }}
          config={{
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: panEnabled ? [] : ['pan2d'],
            responsive: true,
            toImageButtonOptions: {
              format: 'png',
              filename: 'chart',
              height: 600,
              width: 800,
              scale: 1
            }
          }}
          style={{ width: '100%', height: plotHeight }}
          useResizeHandler={true}
          onHover={(data: any) => {
            // Enhanced hover interactions
            console.log('Hover data:', data)
          }}
          onRelayout={(eventData: any) => {
            // Handle zoom and pan events
            if (eventData['xaxis.range[0]'] !== undefined) {
              // User zoomed or panned
              console.log('Chart interaction:', eventData)
            }
          }}
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
          className={`chart-container relative group ${panEnabled ? '' : 'cursor-pointer'}`}
          onClick={panEnabled ? undefined : () => setIsFullscreen(true)}
          title={panEnabled ? "Pan mode active - drag on chart area to pan" : "Click to view fullscreen"}
          ref={chartRef}
        >
          {/* Interactive Controls */}
          <div className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-white bg-opacity-90 border border-gray-200 rounded-lg p-2 shadow-lg">
              <div className="flex flex-col gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleZoomIn()
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleZoomOut()
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleResetZoom()
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePan()
                  }}
                  className={`p-1 hover:bg-gray-100 rounded ${panEnabled ? 'bg-blue-100 text-blue-600' : ''}`}
                  title="Toggle Pan Mode"
                >
                  <Move className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    downloadChart()
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Download Chart"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowControls(!showControls)
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Chart Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Fullscreen indicator */}
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-black bg-opacity-50 text-white p-1 rounded">
              <Maximize2 className="w-4 h-4" />
            </div>
          </div>
          
          {/* Zoom level indicator */}
          {zoomLevel !== 1 && (
            <div className="absolute bottom-2 left-2 z-10 bg-white bg-opacity-90 border border-gray-200 rounded px-2 py-1 text-xs">
              Zoom: {Math.round(zoomLevel * 100)}%
            </div>
          )}
          
          {/* Pan offset indicator */}
          {(panOffset.x !== 0 || panOffset.y !== 0) && (
            <div className="absolute bottom-2 left-2 z-10 bg-green-100 border border-green-200 rounded px-2 py-1 text-xs text-green-600 mt-8">
              Pan: X{panOffset.x > 0 ? '+' : ''}{Math.round(panOffset.x)}, Y{panOffset.y > 0 ? '+' : ''}{Math.round(panOffset.y)}
            </div>
          )}
          
          {/* Pan mode indicator */}
          {panEnabled && (
            <div className="absolute bottom-2 right-2 z-10 bg-blue-100 border border-blue-200 rounded px-2 py-1 text-xs text-blue-600">
              Pan Mode Active - Click & Drag
            </div>
          )}
          
          {/* Chart rendering area with pan handlers */}
          <div 
            className={`chart-render-area ${panEnabled ? 'cursor-move' : ''}`}
            onMouseDown={panEnabled ? handlePanStart : undefined}
            onMouseMove={panEnabled ? handlePanMove : undefined}
            onMouseUp={panEnabled ? handlePanEnd : undefined}
            onMouseLeave={panEnabled ? handlePanEnd : undefined}
            style={{ width: '100%', height: '100%' }}
          >
            {processedChartData.type === 'plotly' || !preferRecharts ? 
              renderPlotlyChart(processedChartData) : 
              renderRechartsChart(processedChartData)
            }
          </div>
        </div>

        {/* Advanced Controls Panel */}
        {showControls && (
          <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-sm font-medium mb-3">Chart Controls</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-gray-600 mb-1">Zoom Level</label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{Math.round(zoomLevel * 100)}%</span>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Interaction Mode</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPanEnabled(false)}
                    className={`px-3 py-1 text-xs rounded ${!panEnabled ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  >
                    Zoom
                  </button>
                  <button
                    onClick={() => setPanEnabled(true)}
                    className={`px-3 py-1 text-xs rounded ${panEnabled ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  >
                    Pan
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleResetZoom}
                className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
              >
                Reset View
              </button>
              <button
                onClick={downloadChart}
                className="px-3 py-1 text-xs bg-green-500 text-white hover:bg-green-600 rounded"
              >
                Export Chart
              </button>
            </div>
          </div>
        )}

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
            {/* Header with controls */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">
                {processedChartData.title || 'Chart'}
              </h2>
              <div className="flex items-center gap-4">
                {/* Fullscreen controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleZoomIn()
                    }}
                    className="text-white hover:text-gray-300 p-2"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleZoomOut()
                    }}
                    className="text-white hover:text-gray-300 p-2"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleResetZoom()
                    }}
                    className="text-white hover:text-gray-300 p-2"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePan()
                    }}
                    className={`p-2 ${panEnabled ? 'text-blue-400' : 'text-white hover:text-gray-300'}`}
                    title="Toggle Pan Mode"
                  >
                    <Move className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      downloadChart()
                    }}
                    className="text-white hover:text-gray-300 p-2"
                    title="Download Chart"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="text-white hover:text-gray-300 p-2"
                  title="Close fullscreen"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Status indicators */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex gap-4 text-sm text-white">
                {zoomLevel !== 1 && (
                  <span className="bg-white bg-opacity-20 px-2 py-1 rounded">
                    Zoom: {Math.round(zoomLevel * 100)}%
                  </span>
                )}
                {panEnabled && (
                  <span className="bg-blue-500 bg-opacity-50 px-2 py-1 rounded">
                    Pan Mode Active
                  </span>
                )}
              </div>
            </div>
            
            {/* Fullscreen Chart */}
            <div className="flex-1 bg-white rounded-lg p-4">
              <div 
                className={`chart-render-area-fullscreen ${panEnabled ? 'cursor-move' : ''}`}
                onMouseDown={panEnabled ? handlePanStart : undefined}
                onMouseMove={panEnabled ? handlePanMove : undefined}
                onMouseUp={panEnabled ? handlePanEnd : undefined}
                onMouseLeave={panEnabled ? handlePanEnd : undefined}
                style={{ width: '100%', height: '100%' }}
              >
                {processedChartData.type === 'plotly' || !preferRecharts ? 
                  renderPlotlyChart(processedChartData, true) : 
                  renderRechartsChart(processedChartData, true)
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
