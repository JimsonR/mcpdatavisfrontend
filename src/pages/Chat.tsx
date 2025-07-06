import { BookOpen, Bot, FileText, Loader2, Plus, Send, Trash2, User, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import MarkdownRenderer from '../components/MarkdownRenderer'
import SmartChart from '../components/SmartChart'
import ToolExecution from '../components/ToolExecution'
import { parseChartData, parseResponseWithInlineCharts } from '../lib/utils'
import {
  getMCPPromptContent,
  getMCPResourceContent,
  listMCPPrompts,
  listMCPResources,
  listMCPServers,
  llmAgent,
  llmAgentDetailed,
  llmChat,
  MCPServer,
  Prompt,
  Resource,
  ResourceContent,
  ToolExecution as ToolExecutionType
} from '../services/api'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  chartData?: any
  toolExecutions?: ToolExecutionType[]
  toolExecutionCharts?: Array<{data: any, type: 'plotly' | 'recharts' | 'unknown', executionIndex: number}>
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [useAgent, setUseAgent] = useState(false)
  const [useDetailedAgent, setUseDetailedAgent] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  // @ts-ignore - servers variable is used by setServers but TS doesn't detect it
  const [servers, setServers] = useState<Record<string, MCPServer>>({})
  const [prompts, setPrompts] = useState<Record<string, Prompt[]>>({})
  const [resources, setResources] = useState<Record<string, Resource[]>>({})
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<{server: string, prompt: Prompt} | null>(null)
  const [promptArguments, setPromptArguments] = useState<Record<string, any>>({})
  const [loadingPrompt, setLoadingPrompt] = useState(false)
  const [loadingResource, setLoadingResource] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    fetchServersData()
  }, [])

  const fetchServersData = async () => {
    try {
      const serversResponse = await listMCPServers()
      setServers(serversResponse.data)
      
      // Load prompts and resources for each server
      const promptsData: Record<string, Prompt[]> = {}
      const resourcesData: Record<string, Resource[]> = {}
      
      for (const [serverName] of Object.entries(serversResponse.data)) {
        try {
          const promptsResponse = await listMCPPrompts(serverName)
          promptsData[serverName] = promptsResponse.data
        } catch (error) {
          console.error(`Failed to load prompts for ${serverName}:`, error)
          promptsData[serverName] = []
        }
        
        try {
          const resourcesResponse = await listMCPResources(serverName)
          resourcesData[serverName] = resourcesResponse.data
        } catch (error) {
          console.error(`Failed to load resources for ${serverName}:`, error)
          resourcesData[serverName] = []
        }
      }
      
      setPrompts(promptsData)
      setResources(resourcesData)
    } catch (error) {
      console.error('Failed to fetch servers data:', error)
    }
  }

  const handlePromptClick = async (server: string, prompt: Prompt) => {
    if (prompt.arguments && prompt.arguments.length > 0) {
      // Prompt has arguments, show modal to collect them
      setSelectedPrompt({ server, prompt })
      setPromptArguments({})
      setShowPromptModal(true)
    } else {
      // Simple prompt, get content directly
      setLoadingPrompt(true)
      try {
        const response = await getMCPPromptContent(server, prompt.name)
        const promptContent = response.data.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')
        setInput(prev => prev ? `${prev}\n\n${promptContent}` : promptContent)
        setShowSidebar(false)
        toast.success('Prompt inserted successfully')
      } catch (error) {
        console.error('Failed to get prompt content:', error)
        toast.error('Failed to load prompt content')
        // Fallback to description if API fails
        const promptText = `${prompt.name}: ${prompt.description || ''}`
        setInput(prev => prev ? `${prev}\n\n${promptText}` : promptText)
        setShowSidebar(false)
      } finally {
        setLoadingPrompt(false)
      }
    }
  }

  const handlePromptSubmit = async () => {
    if (!selectedPrompt) return

    setLoadingPrompt(true)
    try {
      const response = await getMCPPromptContent(selectedPrompt.server, selectedPrompt.prompt.name, promptArguments)
      const promptContent = response.data.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')
      setInput(prev => prev ? `${prev}\n\n${promptContent}` : promptContent)
      toast.success('Prompt inserted successfully')
    } catch (error) {
      console.error('Failed to get prompt content:', error)
      toast.error('Failed to load prompt content')
      // Fallback to formatted metadata if API fails
      const { prompt } = selectedPrompt
      let promptText = `${prompt.name}`
      
      if (prompt.arguments && prompt.arguments.length > 0) {
        promptText += '\n\nArguments:'
        prompt.arguments.forEach((arg: any) => {
          const value = promptArguments[arg.name] || ''
          promptText += `\n- ${arg.name}: ${value}`
        })
      }

      if (prompt.description) {
        promptText += `\n\nDescription: ${prompt.description}`
      }

      setInput(prev => prev ? `${prev}\n\n${promptText}` : promptText)
    } finally {
      setLoadingPrompt(false)
    }

    setShowPromptModal(false)
    setSelectedPrompt(null)
    setPromptArguments({})
    setShowSidebar(false)
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Convert messages to history format for API
      const history = messages.map(msg => ({
        role: msg.type as 'user' | 'assistant',
        content: msg.content
      }))

      let response
      let toolExecutions: ToolExecutionType[] = []

      if (useAgent) {
        if (useDetailedAgent) {
          const detailedResponse = await llmAgentDetailed(userMessage.content, history)
          response = detailedResponse.data
          
          // Process tool executions - merge calls with responses
          const rawToolExecutions = response.tool_executions || []
          
          // Separate tool calls and tool responses
          const toolCalls = rawToolExecutions.filter(exec => exec.tool_name)
          const toolResponses = rawToolExecutions.filter(exec => exec.tool_response)
          
          // Merge tool calls with their responses
          toolExecutions = toolCalls.map(call => {
            const matchingResponse = toolResponses.find(resp => 
              resp.tool_call_id === call.id
            )
            
            return {
              ...call,
              tool_response: matchingResponse?.tool_response
            }
          })
        } else {
          const simpleResponse = await llmAgent(userMessage.content, history)
          response = simpleResponse.data
        }
      } else {
        const chatResponse = await llmChat(userMessage.content, history)
        response = chatResponse.data
      }

      // Parse chart data from main response
      const { chartData, textContent, chartType } = parseChartData(response.response)

      // Parse response and get tool execution charts separately
      const inlineChartData = parseResponseWithInlineCharts(textContent, toolExecutions)

      // Use main response chart if available
      const finalChartData = chartData
      const finalChartType = chartType
      const finalHasChart = !!finalChartData

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: textContent,
        timestamp: new Date(),
        chartData: finalHasChart ? { data: finalChartData, type: finalChartType } : undefined,
        toolExecutions: toolExecutions.length > 0 ? toolExecutions : undefined,
        // Add tool execution charts to be displayed at the end
        toolExecutionCharts: inlineChartData.toolExecutionCharts.length > 0 ? inlineChartData.toolExecutionCharts : undefined
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    toast.success('Chat history cleared')
  }

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      <div className="flex h-[calc(100vh-2rem)]">
  {/* Sidebar for Prompts and Resources */}
  <div className={`${showSidebar ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r border-gray-200 flex flex-col`}>
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Prompts & Resources</h3>
        <button
          onClick={() => setShowSidebar(false)}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
    
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {/* Prompts Section */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <BookOpen className="w-4 h-4 mr-2" />
          Prompts
        </h4>
        {Object.entries(prompts).map(([serverName, serverPrompts]) => (
          <div key={serverName} className="mb-4">
            <h5 className="text-xs font-medium text-gray-500 mb-2">{serverName}</h5>
            <div className="space-y-2">
              {serverPrompts.map((prompt) => (
                <div
                  key={prompt.name}
                  className={`p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer relative ${
                    loadingPrompt ? 'opacity-50 pointer-events-none' : ''
                  }`}
                  onClick={() => !loadingPrompt && handlePromptClick(serverName, prompt)}
                >
                  <p className="text-sm font-medium text-gray-900">{prompt.name}</p>
                  {prompt.description && (
                    <p className="text-xs text-gray-500 mt-1">{prompt.description}</p>
                  )}
                  {prompt.arguments && prompt.arguments.length > 0 && (
                    <p className="text-xs text-blue-500 mt-1">
                      {prompt.arguments.length} argument{prompt.arguments.length !== 1 ? 's' : ''} required
                    </p>
                  )}
                  {loadingPrompt && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                      <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Resources Section */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <FileText className="w-4 h-4 mr-2" />
          Resources
        </h4>
        {Object.entries(resources).map(([serverName, serverResources]) => (
          <div key={serverName} className="mb-4">
            <h5 className="text-xs font-medium text-gray-500 mb-2">{serverName}</h5>
            <div className="space-y-2">                  {serverResources.map((resource) => (
                    <div
                      key={resource.uri}
                      className={`p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer relative ${
                        loadingResource === resource.uri ? 'opacity-50 pointer-events-none' : ''
                      }`}
                      onClick={async () => {
                        try {
                          setLoadingResource(resource.uri)
                          // Fetch the actual resource content
                          const resourceContentResponse = await getMCPResourceContent(serverName, resource.uri)
                          const resourceContents = resourceContentResponse.data
                          
                          let contentText = ''
                          if (resourceContents && resourceContents.length > 0) {
                            contentText = resourceContents.map((content: ResourceContent) => 
                              content.content || '[Binary/Unknown content]'
                            ).join('\n\n')
                          }
                          
                          const resourceText = `**Resource: ${resource.name || resource.uri}**\n\n` +
                            `**Type:** ${resource.mimeType || 'Unknown'}\n` +
                            `**Description:** ${resource.description || 'No description'}\n` +
                            `**URI:** ${resource.uri}\n\n` +
                            `**Content:**\n\`\`\`\n${contentText}\n\`\`\``
                          
                          setInput(prev => prev ? `${prev}\n\n${resourceText}` : resourceText)
                          setShowSidebar(false)
                        } catch (error) {
                          console.error('Failed to fetch resource content:', error)
                          toast.error('Failed to fetch resource content')
                          
                          // Fallback to basic resource info
                          const resourceText = `**Resource: ${resource.name || resource.uri}**\n\n` +
                            `**Type:** ${resource.mimeType || 'Unknown'}\n` +
                            `**Description:** ${resource.description || 'No description'}\n` +
                            `**URI:** ${resource.uri}\n\n` +
                            `*Note: Could not fetch content - resource may not be accessible*`
                          
                          setInput(prev => prev ? `${prev}\n\n${resourceText}` : resourceText)
                          setShowSidebar(false)
                        } finally {
                          setLoadingResource(null)
                        }
                      }}
                    >
                      {loadingResource === resource.uri && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-md">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        </div>
                      )}
                      <p className="text-sm font-medium text-gray-900">{resource.name || resource.uri}</p>
                      {resource.description && (
                        <p className="text-xs text-gray-500 mt-1">{resource.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{resource.mimeType || 'Unknown type'}</p>
                    </div>
                  ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* Main Chat Area */}
  <div className="flex-1 flex flex-col">
    <div className="mb-6 p-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
          <p className="mt-1 text-sm text-gray-500">
            Chat with the AI using direct LLM, agent mode, or detailed agent mode with tool execution tracking.
            {useAgent && (
              <span className="ml-2 text-green-600 font-medium">
                📊 DataFrame charts from run_script will auto-display!
                {useDetailedAgent && <span className="ml-1 text-orange-600">🔧 Tool executions visible!</span>}
              </span>
            )}
            {messages.length > 0 && (
              <span className="ml-2 text-blue-600">
                ({messages.length} message{messages.length !== 1 ? 's' : ''} in history)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearChat}
            disabled={messages.length === 0}
            className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear chat history"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-md"
            title="Add prompts & resources"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Mode Toggle */}
      <div className="mt-4 flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="radio"
            checked={!useAgent}
            onChange={() => setUseAgent(false)}
            className="mr-2"
          />
          <span className="text-sm">Direct LLM</span>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            checked={useAgent && !useDetailedAgent}
            onChange={() => {
              setUseAgent(true)
              setUseDetailedAgent(false)
            }}
            className="mr-2"
          />
          <span className="text-sm">Agent Mode</span>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            checked={useAgent && useDetailedAgent}
            onChange={() => {
              setUseAgent(true)
              setUseDetailedAgent(true)
            }}
            className="mr-2"
          />
          <span className="text-sm">Agent Mode (Detailed)</span>
        </label>
      </div>
    </div>

    {/* Messages */}
    <div className="flex-1 bg-white rounded-lg shadow overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Start a conversation with the AI</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-2xl px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.type === 'assistant' && (
                    <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                  )}
                  {message.type === 'user' && (
                    <User className="w-4 h-4 mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    {/* Render tool executions for assistant messages */}
                    {message.type === 'assistant' && message.toolExecutions && message.toolExecutions.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {message.toolExecutions.map((execution, idx) => {
                          // Extract tool name - it should be directly available from tool_name
                          const toolName = execution.tool_name || 'Unknown Tool'
                          
                          // Extract arguments - handle nested args structure
                          const toolArgs = execution.arguments?.args || execution.arguments || {}
                          
                          return (
                            <ToolExecution
                              key={idx}
                              toolName={toolName}
                              arguments={toolArgs}
                              response={execution.tool_response}
                              id={execution.id || execution.tool_call_id}
                            />
                          )
                        })}
                      </div>
                    )}
                    
                    {/* Render message content with markdown */}
                    <div className="text-sm">
                      <MarkdownRenderer content={message.content} />
                    </div>
                    
                    {/* Render chart if present */}
                    {message.chartData && (
                      <div className="chart-container mt-3">
                        {message.chartData.type === 'recharts' ? (
                          <SmartChart 
                            chartData={message.chartData.data}
                          />
                        ) : (
                          <SmartChart 
                            chartData={message.chartData.data || message.chartData}
                          />
                        )}
                      </div>
                    )}
                    
                    {/* Render tool execution charts at the end */}
                    {message.toolExecutionCharts && message.toolExecutionCharts.length > 0 && (
                      <div className="tool-execution-charts-container mt-4 space-y-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          📊 Generated Visualizations ({message.toolExecutionCharts.length})
                        </h4>
                        {message.toolExecutionCharts.map((chart, idx) => (
                          <div key={idx} className="chart-container border border-gray-200 rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-2">
                              Chart {idx + 1} - From tool execution #{chart.executionIndex + 1}
                            </div>
                            {chart.type === 'recharts' ? (
                              <SmartChart 
                                chartData={chart.data}
                                height={300}
                              />
                            ) : (
                              <SmartChart 
                                chartData={chart.data || chart}
                                height={300}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className={`text-xs mt-1 ${
                      message.type === 'user' ? 'text-primary-200' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 text-gray-900">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4" />
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 min-h-[40px] max-h-32 p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  </div>

  {/* Prompt Arguments Modal */}
  {showPromptModal && selectedPrompt && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full m-4">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Configure Prompt: {selectedPrompt.prompt.name}
            </h3>
            <button
              onClick={() => setShowPromptModal(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {selectedPrompt.prompt.description && (
            <p className="text-sm text-gray-600 mt-2">{selectedPrompt.prompt.description}</p>
          )}
        </div>
        
        <div className="p-4 space-y-4">
          {selectedPrompt.prompt.arguments?.map((arg: any) => (
            <div key={arg.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {arg.name}
                {arg.required && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={promptArguments[arg.name] || ''}
                onChange={(e) => setPromptArguments(prev => ({
                  ...prev,
                  [arg.name]: e.target.value
                }))}
                placeholder={arg.description || `Enter ${arg.name}`}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {arg.description && (
                <p className="text-xs text-gray-500 mt-1">{arg.description}</p>
              )}
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
          <button
            onClick={() => setShowPromptModal(false)}
            disabled={loadingPrompt}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handlePromptSubmit}
            disabled={loadingPrompt}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loadingPrompt && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{loadingPrompt ? 'Loading...' : 'Insert Prompt'}</span>
          </button>
        </div>
      </div>
    </div>
  )}
  
  </div>
  </>
  )
}
