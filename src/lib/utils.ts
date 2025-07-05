import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function parseChartData(content: string): { 
  hasChart: boolean; 
  chartData?: any; 
  textContent: string;
  chartType?: 'plotly' | 'recharts' | 'unknown';
} {
  try {
    // Enhanced regex patterns for different chart formats
    const jsonBlockRegex = /```(?:json|plotly|chart|recharts|visualization)?\s*(\{[\s\S]*?\})\s*```/gi;
    const pythonOutputRegex = /```(?:output|result)?\s*(\{[\s\S]*?\})\s*```/gi;
    const codeBlockRegex = /```python[\s\S]*?```/gi;
    
    let match;
    let chartData = null;
    let chartType: 'plotly' | 'recharts' | 'unknown' = 'unknown';
    let cleanContent = content;

    // Remove Python code blocks first
    cleanContent = cleanContent.replace(codeBlockRegex, '');

    // Function to validate if JSON is MCP simple chart data
    const isMCPSimpleChart = (data: any): boolean => {
      return data && typeof data === 'object' && 
             data.type && data.data && 
             ['histogram', 'line', 'bar', 'pie', 'scatter'].includes(data.type) &&
             (Array.isArray(data.data) || typeof data.data === 'object')
    }

    // Function to validate if JSON is Recharts data
    const isRechartsData = (data: any): boolean => {
      if (data.type && ['line', 'bar', 'pie', 'scatter', 'area'].includes(data.type)) {
        return true;
      }
      if (data.plots && Array.isArray(data.plots)) {
        return data.plots.some((plot: any) => 
          plot.type && ['line', 'bar', 'pie', 'scatter', 'area'].includes(plot.type)
        );
      }
      return false;
    };

    // Function to validate if JSON is Plotly chart data
    const isPlotlyData = (data: any): boolean => {
      // Standard Plotly format: {data: [...], layout: {...}}
      if (data.data && Array.isArray(data.data)) return true;
      
      // Direct data array format: [{x: [...], y: [...], type: 'scatter'}]
      if (Array.isArray(data) && data.length > 0) {
        const firstItem = data[0];
        return firstItem && (firstItem.type || firstItem.x || firstItem.y || firstItem.z);
      }
      
      // Single trace format: {x: [...], y: [...], type: 'scatter'}
      if (data.type || (data.x && data.y)) return true;
      
      // Figure object format (from pandas/plotly)
      if (data.data && data.layout) return true;
      
      // DataFrame.plot() or similar output
      if (data.traces || data.figure) return true;
      
      return false;
    };

    // Look for JSON chart data in code blocks
    const allPatterns = [jsonBlockRegex, pythonOutputRegex];
    for (const pattern of allPatterns) {
      pattern.lastIndex = 0; // Reset regex state
      while ((match = pattern.exec(content)) !== null) {
        try {
          const jsonStr = match[1];
          const parsed = JSON.parse(jsonStr);
          
          // Check for MCP simple chart format first
          if (isMCPSimpleChart(parsed)) {
            chartData = parsed;
            chartType = 'recharts';
            cleanContent = cleanContent.replace(match[0], '');
            break;
          }
          // Check for Recharts format
          else if (isRechartsData(parsed)) {
            chartData = parsed;
            chartType = 'recharts';
            cleanContent = cleanContent.replace(match[0], '');
            break;
          }
          // Then check for Plotly format
          else if (isPlotlyData(parsed)) {
            chartData = parsed;
            chartType = 'plotly';
            cleanContent = cleanContent.replace(match[0], '');
            break;
          }
        } catch (e) {
          // Not valid JSON or not chart data, continue
        }
      }
      if (chartData) break;
    }

    // Also check for inline JSON that might be chart data
    if (!chartData) {
      // First, try to parse the entire content as JSON (for direct tool responses)
      try {
        const entireContentParsed = JSON.parse(content.trim());
        if (isMCPSimpleChart(entireContentParsed)) {
          chartData = entireContentParsed;
          chartType = 'recharts';
          cleanContent = ''; // Clear content since it's just chart data
        } else if (isRechartsData(entireContentParsed)) {
          chartData = entireContentParsed;
          chartType = 'recharts';
          cleanContent = '';
        } else if (isPlotlyData(entireContentParsed)) {
          chartData = entireContentParsed;
          chartType = 'plotly';
          cleanContent = '';
        }
      } catch (e) {
        // Not pure JSON, continue with line-by-line detection
      }
    }

    // Check line by line for JSON
    if (!chartData) {
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (isMCPSimpleChart(parsed)) {
              chartData = parsed;
              chartType = 'recharts';
              cleanContent = cleanContent.replace(line, '');
              break;
            } else if (isRechartsData(parsed)) {
              chartData = parsed;
              chartType = 'recharts';
              cleanContent = cleanContent.replace(line, '');
              break;
            } else if (isPlotlyData(parsed)) {
              chartData = parsed;
              chartType = 'plotly';
              cleanContent = cleanContent.replace(line, '');
              break;
            }
          } catch (e) {
            // Not valid JSON, continue
          }
        }
      }
    }

    // Special handling for DataFrame-generated charts
    if (!chartData) {
      // Look for patterns like "Chart data:" or "Visualization:" followed by JSON
      const dataMarkerRegex = /(?:Chart data|Visualization|Plot data|Figure):\s*(\{[\s\S]*?\})/gi;
      while ((match = dataMarkerRegex.exec(content)) !== null) {
        try {
          const parsed = JSON.parse(match[1]);
          if (isRechartsData(parsed)) {
            chartData = parsed;
            chartType = 'recharts';
            cleanContent = cleanContent.replace(match[0], '');
            break;
          }
          else if (isPlotlyData(parsed)) {
            chartData = parsed;
            chartType = 'plotly';
            cleanContent = cleanContent.replace(match[0], '');
            break;
          }
        } catch (e) {
          // Continue searching
        }
      }
    }

    return {
      hasChart: !!chartData,
      chartData,
      textContent: cleanContent.trim(),
      chartType
    };
  } catch (error) {
    console.error('Error parsing chart data:', error);
    return {
      hasChart: false,
      textContent: content,
      chartType: 'unknown'
    };
  }
}

export function parseResponseWithInlineCharts(
  responseText: string,
  toolExecutions: any[]
): {
  segments: Array<{
    type: 'text' | 'chart'
    content: string
    chartData?: any
    chartType?: 'plotly' | 'recharts' | 'unknown'
  }>
} {
  // Extract chart data from tool executions
  const chartDataMap: Record<string, {data: any, type: 'plotly' | 'recharts' | 'unknown'}> = {}
  
  toolExecutions.forEach((execution) => {
    if (execution.tool_response) {
      const toolResponse = parseChartData(execution.tool_response)
      if (toolResponse.hasChart) {
        const chartData = toolResponse.chartData
        
        // Try to identify chart type from the response
        if (chartData?.type) {
          const chartTypeKey = chartData.type.toLowerCase()
          chartDataMap[chartTypeKey] = {
            data: chartData,
            type: toolResponse.chartType || 'unknown'
          }
          
          // Also map by more descriptive names
          if (chartTypeKey === 'bar') {
            chartDataMap['bar chart'] = chartDataMap[chartTypeKey]
            chartDataMap['barchart'] = chartDataMap[chartTypeKey]
          }
          if (chartTypeKey === 'line') {
            chartDataMap['line chart'] = chartDataMap[chartTypeKey]
            chartDataMap['linechart'] = chartDataMap[chartTypeKey]
          }
          if (chartTypeKey === 'pie') {
            chartDataMap['pie chart'] = chartDataMap[chartTypeKey]
            chartDataMap['piechart'] = chartDataMap[chartTypeKey]
          }
        }
      }
    }
  })

  // Split response into segments and identify where charts should be inserted
  const segments: Array<{
    type: 'text' | 'chart'
    content: string
    chartData?: any
    chartType?: 'plotly' | 'recharts' | 'unknown'
  }> = []

  // Pattern to detect chart descriptions
  const chartPatterns = [
    /A (Bar Chart|Line Chart|Pie Chart|bar chart|line chart|pie chart)/gi,
    /(Bar Chart|Line Chart|Pie Chart|bar chart|line chart|pie chart) (showcases|depicts|illustrates|shows)/gi,
    /The (Bar Chart|Line Chart|Pie Chart|bar chart|line chart|pie chart)/gi,
  ]

  let lastIndex = 0
  const matches: Array<{
    index: number
    length: number
    chartType: string
    fullMatch: string
  }> = []

  // Find all chart mentions
  for (const pattern of chartPatterns) {
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(responseText)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        chartType: match[1].toLowerCase(),
        fullMatch: match[0]
      })
    }
  }

  // Sort matches by position
  matches.sort((a, b) => a.index - b.index)

  // Remove duplicate matches at the same position
  const uniqueMatches = matches.filter((match, index) => {
    if (index === 0) return true
    const prevMatch = matches[index - 1]
    return Math.abs(match.index - prevMatch.index) > 10 // Must be at least 10 chars apart
  })

  // Process each match and create segments
  uniqueMatches.forEach((match, index) => {
    // Add text segment before the chart
    const textBefore = responseText.slice(lastIndex, match.index + match.length)
    
    // Find the end of the current chart description (next bullet point or chart mention)
    let endIndex = responseText.length
    if (index < uniqueMatches.length - 1) {
      endIndex = uniqueMatches[index + 1].index
    } else {
      // Look for next major section or end of text
      const nextSectionPattern = /\n\s*\n\s*[A-Z]/
      const nextSectionMatch = nextSectionPattern.exec(responseText.slice(match.index + match.length))
      if (nextSectionMatch) {
        endIndex = match.index + match.length + nextSectionMatch.index
      }
    }
    
    const chartDescription = responseText.slice(match.index, endIndex)
    
    // Add text segment
    segments.push({
      type: 'text',
      content: textBefore
    })

    // Add chart description text
    segments.push({
      type: 'text', 
      content: chartDescription
    })

    // Add chart if we have the data for this type
    const chartData = chartDataMap[match.chartType]
    if (chartData) {
      segments.push({
        type: 'chart',
        content: `Embedded ${match.chartType}`,
        chartData: chartData.data,
        chartType: chartData.type
      })
    }

    lastIndex = endIndex
  })

  // Add any remaining text
  if (lastIndex < responseText.length) {
    segments.push({
      type: 'text',
      content: responseText.slice(lastIndex)
    })
  }

  // If no charts were found, return the entire text as one segment
  if (segments.length === 0) {
    segments.push({
      type: 'text',
      content: responseText
    })
  }

  return { segments }
}
