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
  history?: Array<{ role: "user" | "assistant"; content: string }>,
  chat_id?: string
) => api.post<ChatResponse>("/llm/chat", { message, history, chat_id });

// LLM Agent
export const llmAgent = (
  message: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>,
  chat_id?: string
) => api.post<ChatResponse>("/llm/agent", { message, history, chat_id });

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
  user_message?: string;
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
  error_type?: string;
  agent_type: string;
}

export const llmAgentDetailed = (
  message: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>,
  chat_id?: string
) =>
  api.post<DetailedAgentResponse>("/llm/agent-detailed", {
    message,
    history,
    chat_id,
  });

export const llmStructuredAgent = (
  message: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>,
  chat_id?: string
) =>
  api.post<StructuredAgentResponse>("/llm/structured-agent", {
    message,
    history,
    chat_id,
  });

// Streaming Structured Agent - returns a response that can be streamed
export const llmStructuredAgentStream = async (
  message: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>,
  chat_id?: string
): Promise<Response> => {
  const response = await fetch("/llm/structured-agent-stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      history,
      chat_id,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
};

export interface LLMMaxTokensResponse {
  max_tokens: number | null;
  model_name: string | null;
}

// Get LLM Max Tokens
export const getLLMMaxTokens = () =>
  api.get<LLMMaxTokensResponse>("/llm/max-tokens");

// LangChain Tools
export const listLangChainTools = (servers?: string) =>
  api.get<Tool[]>("/langchain/list-tools", {
    params: servers ? { servers } : {},
  });

// Chat Session Management
export interface ChatSession {
  chat_id: string;
}

export interface ChatHistory {
  chat_id: string;
  history: Array<
    | {
        role: "user" | "assistant";
        content: string;
      }
    | StructuredAgentResponse
  >;
}

export interface ChatSessionList {
  chat_ids: string[];
}

// Chat session endpoints
export const createChatSession = () =>
  api.post<ChatSession>("/chat/create-session");

export const listChatSessions = () =>
  api.get<ChatSessionList>("/chat/list-sessions");

export const getChatHistory = (chatId: string) =>
  api.get<ChatHistory>(`/chat/get-history/${chatId}`);

export const deleteChatSession = (chatId: string) =>
  api.delete<{ deleted: boolean; chat_id: string; error?: string }>(
    `/chat/delete-session/${chatId}`
  );

// Token usage interface and endpoint
export interface TokenUsage {
  chat_id: string;
  total_tokens: number;
  message_count: number;
}

export const getTokenUsage = (chatId: string) =>
  api.get<TokenUsage>(`/chat/token-usage/${chatId}`);

// Updated chat interface to include chat_id
export interface ChatRequestWithSession {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  chat_id?: string;
}

export default api;
