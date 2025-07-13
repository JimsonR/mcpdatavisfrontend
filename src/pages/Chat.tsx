import {
  BookOpen,
  Bot,
  FileText,
  History,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import MarkdownRenderer from "../components/MarkdownRenderer";
import SmartChart from "../components/SmartChart";
import StructuredResponseRenderer from "../components/StructuredResponseRenderer";
import ToolExecution from "../components/ToolExecution";
import { parseChartData, parseResponseWithInlineCharts } from "../lib/utils";
import {
  createChatSession,
  deleteChatSession,
  getChatHistory,
  getMCPPromptContent,
  getMCPResourceContent,
  listChatSessions,
  listMCPPrompts,
  listMCPResources,
  listMCPServers,
  llmAgent,
  llmAgentDetailed,
  llmChat,
  llmStructuredAgent,
  MCPServer,
  Prompt,
  Resource,
  ResourceContent,
  ToolExecution as ToolExecutionType,
} from "../services/api";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  chartData?: any;
  toolExecutions?: ToolExecutionType[];
  toolExecutionCharts?: Array<{
    data: any;
    type: "plotly" | "recharts" | "unknown";
    executionIndex: number;
  }>;
  canContinue?: boolean;
  error?: boolean;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [useAgent, setUseAgent] = useState(false);
  const [useDetailedAgent, setUseDetailedAgent] = useState(false);
  const [useStructuredAgent, setUseStructuredAgent] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  // @ts-ignore - servers variable is used by setServers but TS doesn't detect it
  const [servers, setServers] = useState<Record<string, MCPServer>>({});
  const [prompts, setPrompts] = useState<Record<string, Prompt[]>>({});
  const [resources, setResources] = useState<Record<string, Resource[]>>({});
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<{
    server: string;
    prompt: Prompt;
  } | null>(null);
  const [promptArguments, setPromptArguments] = useState<Record<string, any>>(
    {}
  );
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [loadingResource, setLoadingResource] = useState<string | null>(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<{
    server: string;
    resource: Resource;
    content: string;
  } | null>(null);
  // Chat session management state
  const [chatSessions, setChatSessions] = useState<string[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [loadingChatHistory, setLoadingChatHistory] = useState(false);
  // State to track expanded tool executions per message
  const [expandedToolExecutions, setExpandedToolExecutions] = useState<
    Record<string, Record<number, boolean>>
  >({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleToolExecution = (messageId: string, executionIndex: number) => {
    setExpandedToolExecutions((prev) => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [executionIndex]: !prev[messageId]?.[executionIndex],
      },
    }));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initializeData = async () => {
      await fetchServersData();
      await loadChatSessions();

      // If no current chat session, create one
      if (!currentChatId) {
        await createNewChatSession();
      }
    };

    initializeData();
  }, []);

  const fetchServersData = async () => {
    try {
      const serversResponse = await listMCPServers();
      setServers(serversResponse.data);

      // Load prompts and resources for each server
      const promptsData: Record<string, Prompt[]> = {};
      const resourcesData: Record<string, Resource[]> = {};

      for (const [serverName] of Object.entries(serversResponse.data)) {
        try {
          const promptsResponse = await listMCPPrompts(serverName);
          promptsData[serverName] = promptsResponse.data;
        } catch (error) {
          console.error(`Failed to load prompts for ${serverName}:`, error);
          promptsData[serverName] = [];
        }

        try {
          const resourcesResponse = await listMCPResources(serverName);
          resourcesData[serverName] = resourcesResponse.data;
        } catch (error) {
          console.error(`Failed to load resources for ${serverName}:`, error);
          resourcesData[serverName] = [];
        }
      }

      setPrompts(promptsData);
      setResources(resourcesData);
    } catch (error) {
      console.error("Failed to fetch servers data:", error);
    }
  };

  // Chat session management functions
  const loadChatSessions = async () => {
    try {
      const response = await listChatSessions();
      setChatSessions(response.data.chat_ids);
    } catch (error) {
      console.error("Failed to load chat sessions:", error);
    }
  };

  const createNewChatSession = async () => {
    try {
      const response = await createChatSession();
      const newChatId = response.data.chat_id;

      // Update chat sessions list
      await loadChatSessions();

      // Switch to new chat and clear messages
      setCurrentChatId(newChatId);
      setMessages([]);

      toast.success("New chat session created");
    } catch (error) {
      console.error("Failed to create chat session:", error);
      toast.error("Failed to create new chat session");
    }
  };

  const switchToChatSession = async (chatId: string) => {
    try {
      setLoadingChatHistory(true);
      const response = await getChatHistory(chatId);

      // Convert backend history format to frontend Message format
      const historyMessages: Message[] = response.data.history.map(
        (msg, index) => ({
          id: `${chatId}-${index}`,
          type: msg.role as "user" | "assistant",
          content: msg.content,
          timestamp: new Date(), // We don't have timestamps from backend, use current time
        })
      );

      setCurrentChatId(chatId);
      setMessages(historyMessages);
    } catch (error) {
      console.error("Failed to load chat history:", error);
      toast.error("Failed to load chat history");
    } finally {
      setLoadingChatHistory(false);
    }
  };

  const deleteChatSessionById = async (chatId: string) => {
    try {
      await deleteChatSession(chatId);

      // Reload sessions list to get updated list
      await loadChatSessions();

      // If we deleted the current chat, handle the transition
      if (currentChatId === chatId) {
        // Get the updated sessions list to check if there are other sessions
        const updatedSessions = await listChatSessions();
        const remainingSessions = updatedSessions.data.chat_ids;

        if (remainingSessions.length > 0) {
          // Switch to the first remaining session
          await switchToChatSession(remainingSessions[0]);
        } else {
          // No sessions left, create a new one
          await createNewChatSession();
        }
      }

      toast.success("Chat session deleted");
    } catch (error) {
      console.error("Failed to delete chat session:", error);
      toast.error("Failed to delete chat session");
    }
  };

  const handlePromptClick = async (server: string, prompt: Prompt) => {
    if (prompt.arguments && prompt.arguments.length > 0) {
      // Prompt has arguments, show modal to collect them
      setSelectedPrompt({ server, prompt });
      setPromptArguments({});
      setShowPromptModal(true);
    } else {
      // Simple prompt, get content directly
      setLoadingPrompt(true);
      try {
        const response = await getMCPPromptContent(server, prompt.name);
        const promptContent = response.data
          .map((msg) => `${msg.role}: ${msg.content}`)
          .join("\n\n");
        setInput((prev) =>
          prev ? `${prev}\n\n${promptContent}` : promptContent
        );
        setShowSidebar(false);
        toast.success("Prompt inserted successfully");
      } catch (error) {
        console.error("Failed to get prompt content:", error);
        toast.error("Failed to load prompt content");
        // Fallback to description if API fails
        const promptText = `${prompt.name}: ${prompt.description || ""}`;
        setInput((prev) => (prev ? `${prev}\n\n${promptText}` : promptText));
        setShowSidebar(false);
      } finally {
        setLoadingPrompt(false);
      }
    }
  };

  const handlePromptSubmit = async () => {
    if (!selectedPrompt) return;

    setLoadingPrompt(true);
    try {
      const response = await getMCPPromptContent(
        selectedPrompt.server,
        selectedPrompt.prompt.name,
        promptArguments
      );
      const promptContent = response.data
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n\n");
      setInput((prev) =>
        prev ? `${prev}\n\n${promptContent}` : promptContent
      );
      toast.success("Prompt inserted successfully");
    } catch (error) {
      console.error("Failed to get prompt content:", error);
      toast.error("Failed to load prompt content");
      // Fallback to formatted metadata if API fails
      const { prompt } = selectedPrompt;
      let promptText = `${prompt.name}`;

      if (prompt.arguments && prompt.arguments.length > 0) {
        promptText += "\n\nArguments:";
        prompt.arguments.forEach((arg: any) => {
          const value = promptArguments[arg.name] || "";
          promptText += `\n- ${arg.name}: ${value}`;
        });
      }

      if (prompt.description) {
        promptText += `\n\nDescription: ${prompt.description}`;
      }

      setInput((prev) => (prev ? `${prev}\n\n${promptText}` : promptText));
    } finally {
      setLoadingPrompt(false);
    }

    setShowPromptModal(false);
    setSelectedPrompt(null);
    setPromptArguments({});
    setShowSidebar(false);
  };

  const handleResourceClick = async (server: string, resource: Resource) => {
    setLoadingResource(resource.uri);
    try {
      // Fetch the actual resource content
      const resourceContentResponse = await getMCPResourceContent(
        server,
        resource.uri
      );
      const resourceContents = resourceContentResponse.data;

      let contentText = "";
      if (resourceContents && resourceContents.length > 0) {
        contentText = resourceContents
          .map(
            (content: ResourceContent) =>
              content.content || "[Binary/Unknown content]"
          )
          .join("\n\n");
      } else {
        contentText = "*No content available*";
      }

      // If the content is a JSON string with a 'csv' property, use that for CSV preview
      let formattedContent = contentText;
      let parsedForCSV = false;
      try {
        // Try to parse as JSON and check for csv property
        const parsed = JSON.parse(contentText);
        if (
          parsed &&
          typeof parsed === "object" &&
          parsed.csv &&
          typeof parsed.csv === "string"
        ) {
          contentText = parsed.csv;
          parsedForCSV = true;
        }
      } catch (e) {}

      // Check if content is CSV and format it as a markdown table
      if (
        parsedForCSV ||
        resource.mimeType?.includes("csv") ||
        resource.uri.endsWith(".csv")
      ) {
        const lines = contentText
          .trim()
          .replace(/\r/g, "")
          .split("\n")
          .filter((line) => line.trim());
        if (lines.length > 1) {
          try {
            const headers = lines[0]
              .split(",")
              .map((h) => h.trim().replace(/"/g, ""));
            if (headers.length > 1) {
              const separator =
                "|" + headers.map(() => " --- ").join("|") + "|";
              const headerRow = "|" + headers.join(" | ") + "|";
              const dataRows = lines.slice(1).map((line) => {
                const cells = line
                  .split(",")
                  .map((cell) => cell.trim().replace(/"/g, ""));
                return "|" + cells.join(" | ") + "|";
              });
              formattedContent = `**CSV Data (${
                lines.length - 1
              } rows):**\n\n${[headerRow, separator, ...dataRows].join("\n")}`;
            }
          } catch (e) {
            // If CSV parsing fails, show as code block
            formattedContent = `**CSV Data:**\n\n\`\`\`csv\n${contentText}\n\`\`\``;
          }
        }
      }
      // Format JSON content
      else if (
        resource.mimeType?.includes("json") ||
        resource.uri.endsWith(".json")
      ) {
        try {
          const parsed = JSON.parse(contentText);
          formattedContent = `**JSON Data:**\n\n\`\`\`json\n${JSON.stringify(
            parsed,
            null,
            2
          )}\n\`\`\``;
        } catch (e) {
          formattedContent = `**JSON Data:**\n\n\`\`\`json\n${contentText}\n\`\`\``;
        }
      }
      // Format code files
      else if (
        resource.mimeType?.includes("text/") ||
        resource.uri.match(
          /\.(js|ts|py|java|cpp|c|go|rs|php|rb|sh|sql|html|css|xml|yaml|yml|md)$/
        )
      ) {
        const extension = resource.uri.split(".").pop() || "text";
        formattedContent = `\`\`\`${extension}\n${contentText}\n\`\`\``;
      }
      // Default: treat as markdown
      else if (!contentText.startsWith("*Error:")) {
        formattedContent = contentText;
      }

      setSelectedResource({ server, resource, content: formattedContent });
      setShowResourceModal(true);
    } catch (error) {
      console.error("Failed to fetch resource content:", error);
      toast.error("Failed to fetch resource content");

      // Show modal with error message
      const errorContent = `*Error: Could not fetch content for this resource.*\n\n**Possible reasons:**\n- Resource may not be accessible\n- Server connection issue\n- Permission denied\n\n**Resource Details:**\n- **URI:** ${
        resource.uri
      }\n- **Type:** ${resource.mimeType || "Unknown"}\n- **Description:** ${
        resource.description || "No description"
      }`;

      setSelectedResource({ server, resource, content: errorContent });
      setShowResourceModal(true);
    } finally {
      setLoadingResource(null);
    }
  };

  const insertResourceIntoChat = () => {
    if (!selectedResource) return;

    const { resource, content } = selectedResource;

    // Since content is already formatted in handleResourceClick, use it directly
    const resourceText =
      `**Resource: ${resource.name || resource.uri}**\n\n` +
      `**Type:** ${resource.mimeType || "Unknown"}\n` +
      `**Description:** ${resource.description || "No description"}\n` +
      `**URI:** ${resource.uri}\n\n` +
      `${content}`;

    setInput((prev) => (prev ? `${prev}\n\n${resourceText}` : resourceText));
    setShowResourceModal(false);
    setSelectedResource(null);
    setShowSidebar(false);
    toast.success("Resource content inserted into chat");
  };

  const sendMessage = async (continueFromLastMessage = false) => {
    if ((!input.trim() && !continueFromLastMessage) || loading || continuing)
      return;

    let userMessage: Message | null = null;

    if (!continueFromLastMessage) {
      userMessage = {
        id: Date.now().toString(),
        type: "user",
        content: input.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage!]);
      setInput("");
    }

    const loadingState = continueFromLastMessage ? setContinuing : setLoading;
    loadingState(true);

    try {
      // Convert messages to history format for API
      const history = messages.map((msg) => ({
        role: msg.type as "user" | "assistant",
        content: msg.content,
      }));

      // For continue, add a special continue message
      const messageToSend = continueFromLastMessage
        ? "Please continue from where you left off and complete the task."
        : userMessage?.content || "";

      let response: any;
      let toolExecutions: ToolExecutionType[] = [];

      if (useStructuredAgent) {
        const structuredResponse = await llmStructuredAgent(
          messageToSend,
          history,
          currentChatId || undefined
        );
        response = structuredResponse.data;

        // Use tool_executions from structured response
        toolExecutions = response.tool_executions || [];
      } else if (useAgent) {
        if (useDetailedAgent) {
          const detailedResponse = await llmAgentDetailed(
            messageToSend,
            history,
            currentChatId || undefined
          );
          response = detailedResponse.data;

          // Process tool executions - merge calls with responses
          const rawToolExecutions = response.tool_executions || [];

          // Separate tool calls and tool responses
          const toolCalls = rawToolExecutions.filter(
            (exec: any) => exec.tool_name
          );
          const toolResponses = rawToolExecutions.filter(
            (exec: any) => exec.tool_response
          );

          // Merge tool calls with their responses
          toolExecutions = toolCalls.map((call: any) => {
            const matchingResponse = toolResponses.find(
              (resp: any) => resp.tool_call_id === call.id
            );

            return {
              ...call,
              tool_response: matchingResponse?.tool_response,
            };
          });
        } else {
          const simpleResponse = await llmAgent(
            messageToSend,
            history,
            currentChatId || undefined
          );
          response = simpleResponse.data;
        }
      } else {
        const chatResponse = await llmChat(
          messageToSend,
          history,
          currentChatId || undefined
        );
        response = chatResponse.data;
      }

      // Parse chart data from main response
      const responseContent = useStructuredAgent
        ? response.formatted_output || response.response
        : response.response;
      const { chartData, textContent, chartType } =
        parseChartData(responseContent);

      // Parse response and get tool execution charts separately
      const inlineChartData = parseResponseWithInlineCharts(
        textContent,
        toolExecutions
      );

      // Use main response chart if available
      const finalChartData = chartData;
      const finalChartType = chartType;
      const finalHasChart = !!finalChartData;

      // Check if the response indicates the agent was interrupted or hit limits
      const responseText = response.response || "";
      const canContinue =
        (useAgent || useStructuredAgent) &&
        (responseText.includes("recursion limit") ||
          responseText.includes("execution time") ||
          responseText.includes("hit recursion limit") ||
          responseText.includes("task may be too complex") ||
          responseText.includes("Agent hit recursion limit"));

      const hasError =
        response.error ||
        responseText.includes("error:") ||
        responseText.includes("Error:");

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: textContent,
        timestamp: new Date(),
        chartData: finalHasChart
          ? { data: finalChartData, type: finalChartType }
          : undefined,
        toolExecutions: toolExecutions.length > 0 ? toolExecutions : undefined,
        // Add tool execution charts to be displayed at the end
        toolExecutionCharts:
          inlineChartData.toolExecutionCharts.length > 0
            ? inlineChartData.toolExecutionCharts
            : undefined,
        canContinue,
        error: hasError,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (canContinue && !hasError) {
        toast.success(
          "Agent paused. You can continue the conversation using the Continue button."
        );
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      loadingState(false);
    }
  };

  const continueConversation = () => {
    sendMessage(true);
  };

  const handleSendClick = () => {
    sendMessage(false);
  };

  const clearChat = () => {
    setMessages([]);
    toast.success("Chat history cleared");
  };

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  return (
    <>
      <div className="flex h-[calc(100vh-2rem)]">
        {/* Sidebar for Prompts and Resources */}
        <div
          className={`${
            showSidebar ? "w-80" : "w-0"
          } transition-all duration-300 overflow-hidden bg-white border-r border-gray-200 flex flex-col`}
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Prompts & Resources
              </h3>
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
                  <h5 className="text-xs font-medium text-gray-500 mb-2">
                    {serverName}
                  </h5>
                  <div className="space-y-2">
                    {serverPrompts.map((prompt) => (
                      <div
                        key={prompt.name}
                        className={`p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer relative ${
                          loadingPrompt ? "opacity-50 pointer-events-none" : ""
                        }`}
                        onClick={() =>
                          !loadingPrompt &&
                          handlePromptClick(serverName, prompt)
                        }
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {prompt.name}
                        </p>
                        {prompt.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {prompt.description}
                          </p>
                        )}
                        {prompt.arguments && prompt.arguments.length > 0 && (
                          <p className="text-xs text-blue-500 mt-1">
                            {prompt.arguments.length} argument
                            {prompt.arguments.length !== 1 ? "s" : ""} required
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
              {Object.entries(resources).map(
                ([serverName, serverResources]) => (
                  <div key={serverName} className="mb-4">
                    <h5 className="text-xs font-medium text-gray-500 mb-2">
                      {serverName}
                    </h5>
                    <div className="space-y-2">
                      {serverResources.map((resource) => (
                        <div
                          key={resource.uri}
                          className={`p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer relative ${
                            loadingResource === resource.uri
                              ? "opacity-50 pointer-events-none"
                              : ""
                          }`}
                          onClick={() =>
                            !loadingResource &&
                            handleResourceClick(serverName, resource)
                          }
                        >
                          {loadingResource === resource.uri && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-md">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            </div>
                          )}
                          <p className="text-sm font-medium text-gray-900">
                            {resource.name || resource.uri}
                          </p>
                          {resource.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {resource.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {resource.mimeType || "Unknown type"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Chat History Sidebar */}
        <div
          className={`${
            showChatHistory ? "w-80" : "w-0"
          } transition-all duration-300 overflow-hidden bg-white border-r border-gray-200 flex flex-col`}
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Chat History
              </h3>
              <button
                onClick={() => setShowChatHistory(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loadingChatHistory ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Loading...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {chatSessions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No chat sessions yet
                  </p>
                ) : (
                  chatSessions.map((sessionId) => (
                    <div
                      key={sessionId}
                      className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${
                        currentChatId === sessionId
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                      onClick={() => switchToChatSession(sessionId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            Chat {sessionId.slice(0, 8)}...
                          </p>
                          <p className="text-xs text-gray-500">
                            {currentChatId === sessionId
                              ? "Current"
                              : "Click to load"}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChatSessionById(sessionId);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete chat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="mb-6 p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Chat
                  {currentChatId && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      Session: {currentChatId.slice(0, 8)}...
                    </span>
                  )}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Chat with the AI using direct LLM, agent mode, detailed agent
                  mode, or structured agent mode with Claude-like formatting.
                  {(useAgent || useStructuredAgent) && (
                    <span className="ml-2 text-green-600 font-medium">
                      📊 DataFrame charts from run_script will auto-display!
                      {useDetailedAgent && (
                        <span className="ml-1 text-orange-600">
                          🔧 Tool executions visible!
                        </span>
                      )}
                      {useStructuredAgent && (
                        <span className="ml-1 text-purple-600">
                          📋 Structured reasoning steps!
                        </span>
                      )}
                      <span className="ml-1 text-blue-600">
                        🔄 Continue button available when agent pauses!
                      </span>
                    </span>
                  )}
                  {messages.length > 0 && (
                    <span className="ml-2 text-blue-600">
                      ({messages.length} message
                      {messages.length !== 1 ? "s" : ""} in history)
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={createNewChatSession}
                  className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-md"
                  title="New chat"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowChatHistory(!showChatHistory)}
                  className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-md"
                  title="Chat history"
                >
                  <History className="w-5 h-5" />
                </button>
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
                  checked={!useAgent && !useStructuredAgent}
                  onChange={() => {
                    setUseAgent(false);
                    setUseDetailedAgent(false);
                    setUseStructuredAgent(false);
                  }}
                  className="mr-2"
                />
                <span className="text-sm">Direct LLM</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={useAgent && !useDetailedAgent && !useStructuredAgent}
                  onChange={() => {
                    setUseAgent(true);
                    setUseDetailedAgent(false);
                    setUseStructuredAgent(false);
                  }}
                  className="mr-2"
                />
                <span className="text-sm">Agent Mode</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={useAgent && useDetailedAgent && !useStructuredAgent}
                  onChange={() => {
                    setUseAgent(true);
                    setUseDetailedAgent(true);
                    setUseStructuredAgent(false);
                  }}
                  className="mr-2"
                />
                <span className="text-sm">Agent Mode (Detailed)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={useStructuredAgent}
                  onChange={() => {
                    setUseAgent(false);
                    setUseDetailedAgent(false);
                    setUseStructuredAgent(true);
                  }}
                  className="mr-2"
                />
                <span className="text-sm">Structured Agent</span>
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
                    className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-2xl px-4 py-2 rounded-lg overflow-x-auto break-all ${
                        message.type === "user"
                          ? "bg-primary-600 text-white"
                          : message.error
                          ? "bg-red-50 text-red-900 border border-red-200"
                          : message.canContinue
                          ? "bg-orange-50 text-orange-900 border border-orange-200"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.type === "assistant" && (
                          <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                        )}
                        {message.type === "user" && (
                          <User className="w-4 h-4 mt-1 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          {/* Render tool executions for assistant messages (not in structured mode since they're in the content) */}
                          {message.type === "assistant" &&
                            message.toolExecutions &&
                            message.toolExecutions.length > 0 &&
                            !(
                              useStructuredAgent && message.type === "assistant"
                            ) && (
                              <div className="mb-3 space-y-2">
                                {message.toolExecutions.map(
                                  (execution, idx) => {
                                    // Extract tool name - it should be directly available from tool_name
                                    const toolName =
                                      execution.tool_name || "Unknown Tool";

                                    // Extract arguments - handle nested args structure
                                    const toolArgs =
                                      execution.arguments?.args ||
                                      execution.arguments ||
                                      {};

                                    // Check if this tool execution is expanded
                                    const isExpanded =
                                      expandedToolExecutions[message.id]?.[
                                        idx
                                      ] || false;

                                    return (
                                      <div
                                        key={idx}
                                        className="border border-gray-200 rounded-md"
                                      >
                                        <div
                                          className="flex items-center justify-between px-2 py-1 bg-gray-50 cursor-pointer select-none rounded-t-md hover:bg-gray-100"
                                          onClick={() =>
                                            toggleToolExecution(message.id, idx)
                                          }
                                        >
                                          <span className="font-semibold text-xs text-gray-700">
                                            {toolName} {isExpanded ? "▼" : "▶"}
                                          </span>
                                          <span className="text-xs text-gray-400">
                                            Tool Call #{idx + 1}
                                          </span>
                                        </div>
                                        {isExpanded && (
                                          <div className="p-2">
                                            <ToolExecution
                                              toolName={toolName}
                                              arguments={toolArgs}
                                              response={execution.tool_response}
                                              id={
                                                execution.id ||
                                                execution.tool_call_id
                                              }
                                            />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            )}

                          {/* Render message content with markdown or structured format */}
                          <div className="text-sm">
                            {useStructuredAgent &&
                            message.type === "assistant" ? (
                              <StructuredResponseRenderer
                                content={message.content}
                                chartData={message.chartData}
                                toolExecutions={message.toolExecutions}
                              />
                            ) : (
                              <MarkdownRenderer content={message.content} />
                            )}
                          </div>

                          {/* Render chart if present (not in structured mode since charts are embedded) */}
                          {message.chartData &&
                            !(
                              useStructuredAgent && message.type === "assistant"
                            ) && (
                              <div className="chart-container mt-3">
                                {message.chartData.type === "recharts" ? (
                                  <SmartChart
                                    chartData={message.chartData.data}
                                  />
                                ) : (
                                  <SmartChart
                                    chartData={
                                      message.chartData.data ||
                                      message.chartData
                                    }
                                  />
                                )}
                              </div>
                            )}

                          {/* Render tool execution charts at the end (not in structured mode since they're handled internally) */}
                          {message.toolExecutionCharts &&
                            message.toolExecutionCharts.length > 0 &&
                            !(
                              useStructuredAgent && message.type === "assistant"
                            ) && (
                              <div className="tool-execution-charts-container mt-4 space-y-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                  📊 Generated Visualizations (
                                  {message.toolExecutionCharts.length})
                                </h4>
                                {message.toolExecutionCharts.map(
                                  (chart, idx) => (
                                    <div
                                      key={idx}
                                      className="chart-container border border-gray-200 rounded-lg p-3"
                                    >
                                      <div className="text-xs text-gray-500 mb-2">
                                        Chart {idx + 1} - From tool execution #
                                        {chart.executionIndex + 1}
                                      </div>
                                      {chart.type === "recharts" ? (
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
                                  )
                                )}
                              </div>
                            )}

                          {/* Continue button for agent messages that can be continued */}
                          {message.type === "assistant" &&
                            message.canContinue &&
                            !continuing && (
                              <div className="mt-3">
                                <button
                                  onClick={continueConversation}
                                  disabled={loading || continuing}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                >
                                  <span>Continue</span>
                                  <Send className="w-3 h-3" />
                                </button>
                                <p className="text-xs text-gray-500 mt-1">
                                  Agent reached a limit or paused. Click to
                                  continue the task.
                                </p>
                              </div>
                            )}

                          {/* Show continuing indicator */}
                          {continuing &&
                            message.id ===
                              messages[messages.length - 1]?.id && (
                              <div className="mt-3 text-xs text-blue-600 flex items-center space-x-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Continuing...</span>
                              </div>
                            )}

                          <p
                            className={`text-xs mt-1 ${
                              message.type === "user"
                                ? "text-primary-200"
                                : "text-gray-500"
                            }`}
                          >
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
                  onClick={handleSendClick}
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
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedPrompt.prompt.description}
                  </p>
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
                      value={promptArguments[arg.name] || ""}
                      onChange={(e) =>
                        setPromptArguments((prev) => ({
                          ...prev,
                          [arg.name]: e.target.value,
                        }))
                      }
                      placeholder={arg.description || `Enter ${arg.name}`}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    {arg.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {arg.description}
                      </p>
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
                  {loadingPrompt && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span>{loadingPrompt ? "Loading..." : "Insert Prompt"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resource Content Modal */}
        {showResourceModal && selectedResource && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full m-4 max-h-[90vh] flex flex-col">
              <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Resource:{" "}
                    {selectedResource.resource.name ||
                      selectedResource.resource.uri}
                  </h3>
                  <button
                    onClick={() => {
                      setShowResourceModal(false);
                      setSelectedResource(null);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <p>
                    <strong>Type:</strong>{" "}
                    {selectedResource.resource.mimeType || "Unknown"}
                  </p>
                  {selectedResource.resource.description && (
                    <p>
                      <strong>Description:</strong>{" "}
                      {selectedResource.resource.description}
                    </p>
                  )}
                  <p>
                    <strong>URI:</strong> {selectedResource.resource.uri}
                  </p>
                  <p>
                    <strong>Server:</strong> {selectedResource.server}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="prose prose-sm max-w-none">
                  <MarkdownRenderer content={selectedResource.content} />
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 flex justify-end space-x-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setShowResourceModal(false);
                    setSelectedResource(null);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={insertResourceIntoChat}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center space-x-2"
                >
                  <span>Insert into Chat</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
