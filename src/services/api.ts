import axios from "axios";

const api = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
});

// MCP Server Health
export const getMCPServerHealth = () =>
  api.get<Record<string, { reachable: boolean }>>("/mcp/server-health");

export interface MCPServer {
  url: string;
  transport: string;
}

export interface Tool {
  name: string;
  description?: string;
  inputSchema?: any;
}

export interface Resource {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

export interface Prompt {
  name: string;
  description?: string;
  arguments?: any[];
}

export interface ChatMessage {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface ChatResponse {
  response: string;
  error?: boolean;
}

export interface PromptMessage {
  role: string;
  content: string;
}

// Health check
export const healthCheck = () => api.get("/api/health");

// MCP Server Management
export const listMCPServers = () =>
  api.get<Record<string, MCPServer>>("/mcp/servers");
export const addMCPServer = (name: string, config: MCPServer) =>
  api.post("/mcp/servers", config, { params: { name } });
export const updateMCPServer = (name: string, config: MCPServer) =>
  api.put(`/mcp/servers/${name}`, config);
export const deleteMCPServer = (name: string) =>
  api.delete(`/mcp/servers/${name}`);

// MCP Tools
export const listMCPTools = (server: string) =>
  api.get<Tool[]>("/mcp/list-tools", { params: { server } });
export const callMCPTool = (
  server: string,
  toolName: string,
  arguments_: any
) =>
  api.post("/mcp/call-tool", arguments_, {
    params: { server, tool_name: toolName },
  });

// MCP Resources
export const listMCPResources = (server: string) =>
  api.get<Resource[]>("/mcp/list-resources", { params: { server } });

// Get resource content by URI
export interface ResourceContent {
  mimeType?: string;
  type: "text" | "binary" | "unknown";
  content?: string;
}

export const getMCPResourceContent = (server: string, uri: string) =>
  api.get<ResourceContent[]>("/mcp/get-resource-content", {
    params: { server, uri },
  });

// MCP Prompts
export const listMCPPrompts = (server: string) =>
  api.get<Prompt[]>("/mcp/list-prompts", { params: { server } });
export const getMCPPromptContent = (
  server: string,
  promptName: string,
  arguments_: Record<string, any> = {}
) =>
  api.post<PromptMessage[]>("/mcp/get-prompt-content", arguments_, {
    params: { server, prompt_name: promptName },
  });

// LLM Chat
export const llmChat = (
  message: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
) => api.post<ChatResponse>("/llm/chat", { message, history });

// LLM Agent
export const llmAgent = (
  message: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
) => api.post<ChatResponse>("/llm/agent", { message, history });

// LLM Agent with detailed tool execution info
export interface ToolExecution {
  tool_name?: string;
  arguments?: any;
  id?: string;
  tool_response?: string;
  tool_call_id?: string;
}

export interface DetailedAgentResponse {
  response: string;
  tool_executions: ToolExecution[];
  full_conversation: Array<{
    type: string;
    content: string;
    role?: string;
  }>;
  error?: boolean;
}

export interface StructuredAgentResponse {
  response: string;
  formatted_output: string;
  reasoning_steps: Array<{
    reasoning?: string;
    tool_calls?: boolean;
    tool_results?: Array<{
      tool_name: string;
      arguments: any;
      result: string;
    }>;
  }>;
  tool_executions: ToolExecution[];
  iterations: number;
  messages: string[];
  success: boolean;
  error: boolean;
  agent_type: string;
}

export const llmAgentDetailed = (
  message: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
) =>
  api.post<DetailedAgentResponse>("/llm/agent-detailed", { message, history });

export const llmStructuredAgent = (
  message: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
) =>
  api.post<StructuredAgentResponse>("/llm/structured-agent", {
    message,
    history,
  });

// LangChain Tools
export const listLangChainTools = (servers?: string) =>
  api.get<Tool[]>("/langchain/list-tools", {
    params: servers ? { servers } : {},
  });

export default api;
