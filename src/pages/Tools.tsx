import { Loader2, Play, Server, Wrench, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
    callMCPTool,
    listMCPServers,
    listMCPTools,
    MCPServer,
    Tool
} from '../services/api'

interface ToolExecution {
  toolName: string
  server: string
  arguments: any
  result?: any
  error?: string
  loading: boolean
}

export default function Tools() {
  const [servers, setServers] = useState<Record<string, MCPServer>>({})
  const [tools, setTools] = useState<Record<string, Tool[]>>({})
  const [selectedServer, setSelectedServer] = useState<string>('')
  const [executions, setExecutions] = useState<ToolExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [showArgumentsModal, setShowArgumentsModal] = useState(false)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [toolArguments, setToolArguments] = useState<string>('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const serversResponse = await listMCPServers()
      setServers(serversResponse.data)
      
      // Load tools for each server
      const toolsData: Record<string, Tool[]> = {}
      for (const [serverName] of Object.entries(serversResponse.data)) {
        try {
          const toolsResponse = await listMCPTools(serverName)
          toolsData[serverName] = toolsResponse.data
        } catch (error) {
          console.error(`Failed to load tools for ${serverName}:`, error)
          toolsData[serverName] = []
        }
      }
      setTools(toolsData)
      
      if (Object.keys(serversResponse.data).length > 0 && !selectedServer) {
        setSelectedServer(Object.keys(serversResponse.data)[0])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load tools')
    } finally {
      setLoading(false)
    }
  }

  const openToolModal = (tool: Tool) => {
    setSelectedTool(tool)
    // Pre-populate with example arguments based on schema
    if (tool.inputSchema && tool.inputSchema.properties) {
      const example: any = {}
      Object.entries(tool.inputSchema.properties).forEach(([key, prop]: [string, any]) => {
        if (prop.type === 'string') {
          example[key] = prop.example || `example_${key}`
        } else if (prop.type === 'number') {
          example[key] = prop.example || 0
        } else if (prop.type === 'boolean') {
          example[key] = prop.example || false
        }
      })
      setToolArguments(JSON.stringify(example, null, 2))
    } else {
      setToolArguments('{}')
    }
    setShowArgumentsModal(true)
  }

  const executeTool = async () => {
    if (!selectedTool || !selectedServer) return
    
    let arguments_: any = {}
    
    if (toolArguments.trim()) {
      try {
        arguments_ = JSON.parse(toolArguments)
      } catch (error) {
        toast.error('Invalid JSON format')
        return
      }
    }

    const execution: ToolExecution = {
      toolName: selectedTool.name,
      server: selectedServer,
      arguments: arguments_,
      loading: true
    }

    setExecutions(prev => [execution, ...prev])
    setShowArgumentsModal(false)
    setSelectedTool(null)
    setToolArguments('')

    try {
      const response = await callMCPTool(selectedServer, selectedTool.name, arguments_)
      setExecutions(prev => 
        prev.map(exec => 
          exec === execution 
            ? { ...exec, result: response.data, loading: false }
            : exec
        )
      )
      toast.success('Tool executed successfully')
    } catch (error) {
      console.error('Failed to execute tool:', error)
      setExecutions(prev => 
        prev.map(exec => 
          exec === execution 
            ? { ...exec, error: 'Failed to execute tool', loading: false }
            : exec
        )
      )
      toast.error('Failed to execute tool')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const currentTools = selectedServer ? tools[selectedServer] || [] : []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tools</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse and execute tools from your MCP servers.
        </p>
      </div>

      {Object.keys(servers).length === 0 ? (
        <div className="text-center py-12">
          <Server className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No servers configured</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add some MCP servers first to see their tools.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Server Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Server
            </label>
            <select
              value={selectedServer}
              onChange={(e) => setSelectedServer(e.target.value)}
              className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              {Object.keys(servers).map(serverName => (
                <option key={serverName} value={serverName}>
                  {serverName}
                </option>
              ))}
            </select>
          </div>

          {/* Tools List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Available Tools
                {selectedServer && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({currentTools.length} tools)
                  </span>
                )}
              </h3>
            </div>
            
            {currentTools.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tools available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This server doesn't have any tools available.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {currentTools.map((tool) => (
                  <li key={tool.name}>
                    <div className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <Wrench className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{tool.name}</p>
                              {tool.description && (
                                <p className="mt-1 text-sm text-gray-500">{tool.description}</p>
                              )}
                              {tool.inputSchema && (
                                <details className="mt-2">
                                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                                    View Schema
                                  </summary>
                                  <pre className="mt-1 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(tool.inputSchema, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => openToolModal(tool)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Execute
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Execution History */}
          {executions.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Execution History
                </h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <ul className="divide-y divide-gray-200">
                  {executions.map((execution, index) => (
                    <li key={index} className="px-4 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {execution.loading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                          ) : execution.error ? (
                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-red-600 text-xs">✕</span>
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-green-600 text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {execution.toolName} <span className="text-gray-500">on {execution.server}</span>
                          </p>
                          {Object.keys(execution.arguments).length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs text-gray-500">Arguments:</p>
                              <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                                {JSON.stringify(execution.arguments, null, 2)}
                              </pre>
                            </div>
                          )}
                          {execution.result && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500">Result:</p>
                              <pre className="text-xs text-gray-600 bg-green-50 p-2 rounded mt-1 overflow-x-auto">
                                {JSON.stringify(execution.result, null, 2)}
                              </pre>
                            </div>
                          )}
                          {execution.error && (
                            <div className="mt-2">
                              <p className="text-xs text-red-600">Error: {execution.error}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tool Arguments Modal */}
      {showArgumentsModal && selectedTool && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Execute Tool: {selectedTool.name}
              </h3>
              <button
                onClick={() => {
                  setShowArgumentsModal(false)
                  setSelectedTool(null)
                  setToolArguments('')
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {selectedTool.description && (
              <p className="text-sm text-gray-600 mb-4">{selectedTool.description}</p>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arguments (JSON format)
              </label>
              <textarea
                value={toolArguments}
                onChange={(e) => setToolArguments(e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter tool arguments as JSON..."
              />
              
              {selectedTool.inputSchema && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                    View Schema
                  </summary>
                  <pre className="mt-1 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(selectedTool.inputSchema, null, 2)}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowArgumentsModal(false)
                  setSelectedTool(null)
                  setToolArguments('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={executeTool}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                Execute Tool
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
