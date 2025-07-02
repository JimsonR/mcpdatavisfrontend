import React from 'react'
import Plot from 'react-plotly.js'

interface PlotlyChartProps {
  data: any
  layout?: any
  config?: any
  className?: string
}

export default function PlotlyChart({ data, layout = {}, config = {}, className = '' }: PlotlyChartProps) {
  // Process and normalize the data for different DataFrame formats
  const processedData = React.useMemo(() => {
    try {
      // Handle different data formats that might come from DataFrames
      
      // If data has a 'data' property (standard Plotly format)
      if (data?.data) {
        return data.data;
      }
      
      // If data is already an array of traces
      if (Array.isArray(data)) {
        return data;
      }
      
      // If data is a single trace object
      if (data?.type || (data?.x && data?.y)) {
        return [data];
      }
      
      // If data has traces property (some DataFrame outputs)
      if (data?.traces) {
        return data.traces;
      }
      
      // If data has figure property
      if (data?.figure?.data) {
        return data.figure.data;
      }
      
      // Fallback - try to use data as-is
      return data;
    } catch (error) {
      console.error('Error processing chart data:', error);
      return data;
    }
  }, [data]);

  // Process layout with DataFrame-friendly defaults
  const processedLayout = React.useMemo(() => {
    let finalLayout = { ...layout };
    
    // Extract layout from different formats
    if (data?.layout) {
      finalLayout = { ...data.layout, ...layout };
    } else if (data?.figure?.layout) {
      finalLayout = { ...data.figure.layout, ...layout };
    }
    
    return {
      autosize: true,
      margin: { l: 50, r: 50, t: 50, b: 50 },
      paper_bgcolor: 'white',
      plot_bgcolor: 'white',
      font: { family: 'Inter, system-ui, sans-serif', size: 12 },
      // DataFrame-friendly defaults
      showlegend: true,
      hovermode: 'closest',
      ...finalLayout
    };
  }, [data, layout]);

  const defaultConfig = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    responsive: true,
    // Better for DataFrame visualizations
    toImageButtonOptions: {
      format: 'png',
      filename: 'chart',
      height: 500,
      width: 700,
      scale: 1
    },
    ...config
  }

  try {
    return (
      <div className={`plotly-chart ${className}`}>
        <Plot
          data={processedData}
          layout={processedLayout}
          config={defaultConfig}
          style={{ width: '100%', height: '400px' }}
          useResizeHandler={true}
        />
      </div>
    )
  } catch (error) {
    console.error('Error rendering Plotly chart:', error)
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-md">
        <p className="text-red-700 text-sm">
          Error rendering chart: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
        <details className="mt-2">
          <summary className="text-xs text-red-600 cursor-pointer">Debug Info</summary>
          <pre className="text-xs mt-1 p-2 bg-red-100 rounded overflow-x-auto">
            {JSON.stringify({ data: processedData, layout: processedLayout }, null, 2)}
          </pre>
        </details>
      </div>
    )
  }
}
