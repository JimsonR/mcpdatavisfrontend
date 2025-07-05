import { ChevronDown, ChevronRight, Wrench, Zap } from 'lucide-react'
import { useState } from 'react'
import { parseChartData } from '../lib/utils'
import MarkdownRenderer from './MarkdownRenderer'
import SmartChart from './SmartChart'

interface ToolExecutionProps {
  toolName: string
  arguments?: any
  response?: string
  id?: string
}

export default function ToolExecution({ toolName, arguments: args, response, id }: ToolExecutionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Check if the tool response contains chart data
  const chartInfo = response ? parseChartData(response) : { hasChart: false, chartData: null, chartType: 'unknown' }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 my-2">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-6 h-6 bg-orange-100 rounded">
            <Wrench className="w-4 h-4 text-orange-600" />
          </div>
          <span className="font-medium text-orange-800">
            {toolName || 'Unknown Tool'}
          </span>
          <Zap className="w-4 h-4 text-orange-500" />
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-orange-600" />
        ) : (
          <ChevronRight className="w-4 h-4 text-orange-600" />
        )}
      </div>
      
      {isExpanded && (
        <div className="mt-3 space-y-2">
          {args && Object.keys(args).length > 0 && (
            <div>
              <p className="text-xs font-medium text-orange-700 mb-1">Arguments:</p>
              <pre className="text-xs bg-orange-100 p-2 rounded overflow-x-auto text-orange-800">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          )}
          
          {response && (
            <div>
              <p className="text-xs font-medium text-orange-700 mb-1">Response:</p>
              <div className="text-xs bg-orange-100 p-2 rounded text-orange-800">
                <MarkdownRenderer content={response} className="text-orange-800" />
              </div>
              
              {/* Render chart if tool response contains visualization data */}
              {chartInfo.hasChart && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-orange-700 mb-2">Generated Visualization:</p>
                  <div className="bg-white rounded border border-orange-200 p-2">
                    <SmartChart 
                      chartData={chartInfo.chartData}
                      preferRecharts={chartInfo.chartType === 'recharts'}
                      height={250}
                      className="tool-chart"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          
          {id && (
            <div>
              <p className="text-xs text-orange-600">ID: {id}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
