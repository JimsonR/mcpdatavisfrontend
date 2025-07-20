import { Bot, User } from "lucide-react";
import React from "react";
import { ToolExecution as ToolExecutionType } from "../services/api";
import MarkdownRenderer from "./MarkdownRenderer";
import SmartChart from "./SmartChart";
import StructuredResponseRenderer from "./StructuredResponseRenderer";
import ToolExecution from "./ToolExecution";

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

interface MessageComponentProps {
  message: Message;
  useStructuredAgent: boolean;
  expandedToolExecutions: Record<string, Record<number, boolean>>;
  onToggleToolExecution: (messageId: string, executionIndex: number) => void;
  onContinue?: () => void;
  continuing?: boolean;
  isLastMessage?: boolean;
}

const MessageComponent = React.memo(
  ({
    message,
    useStructuredAgent,
    expandedToolExecutions,
    onToggleToolExecution,
    onContinue,
    continuing,
    isLastMessage,
  }: MessageComponentProps) => {
    return (
      <div
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
                !(useStructuredAgent && message.type === "assistant") && (
                  <div className="mb-3 space-y-2">
                    {message.toolExecutions.map((execution, idx) => {
                      // Extract tool name - it should be directly available from tool_name
                      const toolName = execution.tool_name || "Unknown Tool";

                      // Extract arguments - handle nested args structure
                      const toolArgs =
                        execution.arguments?.args || execution.arguments || {};

                      // Check if this tool execution is expanded
                      const isExpanded =
                        expandedToolExecutions[message.id]?.[idx] || false;

                      return (
                        <div
                          key={idx}
                          className="border border-gray-200 rounded-md"
                        >
                          <div
                            className="flex items-center justify-between px-2 py-1 bg-gray-50 cursor-pointer select-none rounded-t-md hover:bg-gray-100"
                            onClick={() =>
                              onToggleToolExecution(message.id, idx)
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
                                id={execution.id || execution.tool_call_id}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

              {/* Render message content with markdown or structured format */}
              <div className="text-sm">
                {useStructuredAgent && message.type === "assistant" ? (
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
                !(useStructuredAgent && message.type === "assistant") && (
                  <div className="chart-container mt-3">
                    {message.chartData.type === "recharts" ? (
                      <SmartChart chartData={message.chartData.data} />
                    ) : (
                      <SmartChart
                        chartData={message.chartData.data || message.chartData}
                      />
                    )}
                  </div>
                )}

              {/* Render tool execution charts at the end (not in structured mode since they're handled internally) */}
              {message.toolExecutionCharts &&
                message.toolExecutionCharts.length > 0 &&
                !(useStructuredAgent && message.type === "assistant") && (
                  <div className="tool-execution-charts-container mt-4 space-y-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      📊 Generated Visualizations (
                      {message.toolExecutionCharts.length})
                    </h4>
                    {message.toolExecutionCharts.map((chart, idx) => (
                      <div
                        key={idx}
                        className="chart-container border border-gray-200 rounded-lg p-3"
                      >
                        <div className="text-xs text-gray-500 mb-2">
                          Chart {idx + 1} - From tool execution #
                          {chart.executionIndex + 1}
                        </div>
                        {chart.type === "recharts" ? (
                          <SmartChart chartData={chart.data} height={300} />
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

              {/* Continue button for agent messages that can be continued */}
              {message.type === "assistant" &&
                message.canContinue &&
                !continuing &&
                onContinue && (
                  <div className="mt-3">
                    <button
                      onClick={onContinue}
                      disabled={continuing}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      <span>Continue</span>
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    </button>
                    <p className="text-xs text-gray-500 mt-1">
                      Agent reached a limit or paused. Click to continue the
                      task.
                    </p>
                  </div>
                )}

              {/* Show continuing indicator */}
              {continuing && isLastMessage && (
                <div className="mt-3 text-xs text-blue-600 flex items-center space-x-1">
                  <svg
                    className="w-3 h-3 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Continuing...</span>
                </div>
              )}

              <p
                className={`text-xs mt-1 ${
                  message.type === "user" ? "text-primary-200" : "text-gray-500"
                }`}
              >
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

MessageComponent.displayName = "MessageComponent";

export default MessageComponent;
