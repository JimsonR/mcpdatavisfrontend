import React, { useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import SmartChart from "./SmartChart";
import { StructuredContentParser } from "../utils/structuredContentParser";

interface StructuredResponseRendererProps {
  content: string;
  className?: string;
  chartData?: any;
  toolExecutions?: any[];
}

interface ParsedBlock {
  type:
    | "text"
    | "tool_call"
    | "chart"
    | "thinking"
    | "result"
    | "action"
    | "action_input"
    | "observation"
    | "final_answer"
    | "error"
    | "tool_use";
  content: string;
  toolName?: string;
  args?: string;
  toolResult?: string;
  reasoning?: string;
}

const StructuredResponseRenderer = React.memo(
  function StructuredResponseRenderer({
    content,
    className = "",
    chartData,
    toolExecutions,
  }: StructuredResponseRendererProps) {
    // State to track expanded tool calls
    const [expandedToolCalls, setExpandedToolCalls] = useState<
      Record<number, boolean>
    >({});

    // State to track expanded tool usage blocks
    const [expandedToolUsage, setExpandedToolUsage] = useState<
      Record<number, boolean>
    >({});

    const toggleToolCall = (index: number) => {
      setExpandedToolCalls((prev) => ({
        ...prev,
        [index]: !prev[index],
      }));
    };

    const toggleToolUsage = (index: number) => {
      setExpandedToolUsage((prev) => ({
        ...prev,
        [index]: !prev[index],
      }));
    };

    const isChartData = (text: string): boolean => {
      try {
        const parsed = JSON.parse(text);
        // Check for various chart data patterns
        return (
          typeof parsed === "object" &&
          parsed !== null &&
          (parsed.type ||
            parsed.data ||
            parsed.series ||
            (parsed.x && parsed.y) ||
            parsed.labels ||
            parsed.datasets ||
            parsed.bars ||
            parsed.points)
        );
      } catch {
        return false;
      }
    };

    const detectChartsInToolExecutions = (): ParsedBlock[] => {
      const chartBlocks: ParsedBlock[] = [];

      if (toolExecutions && toolExecutions.length > 0) {
        toolExecutions.forEach((execution, index) => {
          const response = execution.tool_response || execution.response || "";

          // Check if the tool response contains chart data
          if (typeof response === "string" && isChartData(response)) {
            chartBlocks.push({
              type: "chart",
              content: response,
              toolName: execution.tool_name,
              reasoning: `Chart generated from ${
                execution.tool_name
              } (execution #${index + 1})`,
            });
          } else if (typeof response === "object" && response !== null) {
            // If response is already an object, check if it's chart data
            const responseStr = JSON.stringify(response);
            if (isChartData(responseStr)) {
              chartBlocks.push({
                type: "chart",
                content: responseStr,
                toolName: execution.tool_name,
                reasoning: `Chart generated from ${
                  execution.tool_name
                } (execution #${index + 1})`,
              });
            }
          }
        });
      }

      return chartBlocks;
    };
    const parseStructuredContent = (text: string): ParsedBlock[] => {
      // Use the robust XML-based parser
      const parser = new StructuredContentParser();
      const parsedBlocks = parser.parseStructuredContent(text);
      
      // Convert to the component's block format and process text blocks for charts
      const finalBlocks: ParsedBlock[] = [];
      
      for (const block of parsedBlocks) {
        if (block.type === 'text') {
          // Process text content for embedded charts
          const chartBlocks = parser.processTextForCharts(block.content);
          finalBlocks.push(...chartBlocks.map(cb => ({
            ...cb,
            type: cb.type as ParsedBlock['type']
          })));
        } else {
          // Add structured blocks as-is
          finalBlocks.push({
            ...block,
            type: block.type as ParsedBlock['type']
          });
        }
      }
      
      return finalBlocks.filter((block) => block.content.trim() !== "");
    };

    const renderBlock = (block: ParsedBlock, index: number) => {
      switch (block.type) {
        case "text":
          // Filter out any remaining placeholder blocks
          const cleanContent = block.content.replace(/<!.*?!>/g, "").trim();
          if (!cleanContent) return null;

          return (
            <div key={index} className="mb-4">
              <MarkdownRenderer content={cleanContent} />
            </div>
          );

        case "thinking":
          return (
            <div
              key={index}
              className="mb-4 border border-yellow-200 rounded-lg bg-yellow-50 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="font-semibold text-yellow-800">Thinking</span>
              </div>
              <div className="text-sm text-gray-700 italic">
                <MarkdownRenderer content={block.content} />
              </div>
            </div>
          );

        case "result":
          return (
            <div
              key={index}
              className="mb-4 border border-green-200 rounded-lg bg-green-50 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-semibold text-green-800">Result</span>
              </div>
              <div className="text-sm text-gray-700">
                <MarkdownRenderer content={block.content} />
              </div>
            </div>
          );

        case "final_answer":
          return (
            <div
              key={index}
              className="mb-4 border border-green-200 rounded-lg bg-green-50 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-semibold text-green-800">
                  Final Answer
                </span>
              </div>
              <div className="text-sm text-gray-700">
                <MarkdownRenderer content={block.content} />
              </div>
            </div>
          );

        case "action":
          return (
            <div
              key={index}
              className="mb-4 border border-blue-200 rounded-lg bg-blue-50 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-semibold text-blue-800">Action</span>
              </div>
              <div className="text-sm text-gray-700 font-mono">
                {block.content}
              </div>
            </div>
          );

        case "action_input":
          return (
            <div
              key={index}
              className="mb-4 border border-purple-200 rounded-lg bg-purple-50 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="font-semibold text-purple-800">
                  Action Input
                </span>
              </div>
              <div className="bg-white rounded border p-3">
                <pre className="text-sm overflow-x-auto text-gray-800 whitespace-pre-wrap break-all max-w-full lg:max-w-3xl rounded bg-gray-50 p-2">
                  {block.content}
                </pre>
              </div>
            </div>
          );

        case "observation":
          return (
            <div
              key={index}
              className="mb-4 border border-orange-200 rounded-lg bg-orange-50 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="font-semibold text-orange-800">
                  Observation
                </span>
              </div>
              <div className="text-sm text-gray-700">
                {(() => {
                  // Check if observation contains chart data
                  try {
                    const parsed = JSON.parse(block.content);
                    if (isChartData(block.content)) {
                      return (
                        <div className="bg-white rounded border p-2">
                          <div className="text-xs text-gray-600 mb-2">
                            📊 Chart detected in observation:
                          </div>
                          <SmartChart chartData={parsed} />
                        </div>
                      );
                    }
                    // Regular JSON formatting
                    return (
                      <pre className="whitespace-pre-wrap overflow-x-auto break-all max-w-full lg:max-w-3xl rounded bg-gray-50 p-2">
                        {JSON.stringify(parsed, null, 2)}
                      </pre>
                    );
                  } catch {
                    // Not JSON, render as markdown
                    return <MarkdownRenderer content={block.content} />;
                  }
                })()}
              </div>
            </div>
          );

        case "error":
          return (
            <div
              key={index}
              className="mb-4 border border-red-200 rounded-lg bg-red-50 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="font-semibold text-red-800">Error</span>
              </div>
              <div className="text-sm text-red-700">
                <MarkdownRenderer content={block.content} />
              </div>
            </div>
          );

        case "tool_use":
          const isToolUsageExpanded = expandedToolUsage[index] || false;
          return (
            <div
              key={index}
              className="mb-4 border border-slate-200 rounded-lg bg-slate-50"
            >
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-slate-100 rounded-t-lg"
                onClick={() => toggleToolUsage(index)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                  <span className="font-semibold text-slate-800">
                    Tool Usage {isToolUsageExpanded ? "▼" : "▶"}
                  </span>
                </div>
                <span className="text-xs text-slate-600">
                  Click to {isToolUsageExpanded ? "collapse" : "expand"}
                </span>
              </div>

              {isToolUsageExpanded && (
                <div className="p-4 pt-0 space-y-3">
                  {(() => {
                    // Parse the inner content for action, action_input, and observation
                    const content = block.content;
                    const actionMatch = content.match(
                      /<action>(.*?)<\/action>/s
                    );
                    const actionInputMatch = content.match(
                      /<action_input>(.*?)<\/action_input>/s
                    );
                    const observationMatch = content.match(
                      /<observation>(.*?)<\/observation>/s
                    );

                    return (
                      <>
                        {actionMatch && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                              <span className="text-sm font-medium text-blue-800">
                                Action
                              </span>
                            </div>
                            <div className="text-sm text-gray-700 font-mono">
                              {actionMatch[1].trim()}
                            </div>
                          </div>
                        )}

                        {actionInputMatch && (
                          <div className="bg-purple-50 border border-purple-200 rounded p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                              <span className="text-sm font-medium text-purple-800">
                                Input
                              </span>
                            </div>
                            <div className="bg-white rounded border p-2">
                              <pre className="text-xs overflow-x-auto text-gray-800 whitespace-pre-wrap break-all max-w-full lg:max-w-3xl">
                                {actionInputMatch[1].trim()}
                              </pre>
                            </div>
                          </div>
                        )}

                        {observationMatch && (
                          <div className="bg-orange-50 border border-orange-200 rounded p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                              <span className="text-sm font-medium text-orange-800">
                                Result
                              </span>
                            </div>
                            <div className="text-sm text-gray-700">
                              {(() => {
                                const observationContent =
                                  observationMatch[1].trim();
                                // Check if observation contains chart data
                                try {
                                  const parsed = JSON.parse(observationContent);
                                  if (isChartData(observationContent)) {
                                    return (
                                      <div className="bg-white rounded border p-2">
                                        <div className="text-xs text-gray-600 mb-2">
                                          📊 Chart detected:
                                        </div>
                                        <SmartChart chartData={parsed} />
                                      </div>
                                    );
                                  }
                                  // Regular JSON formatting
                                  return (
                                    <pre className="whitespace-pre-wrap overflow-x-auto break-all max-w-full lg:max-w-3xl rounded bg-gray-50 p-2 text-xs">
                                      {JSON.stringify(parsed, null, 2)}
                                    </pre>
                                  );
                                } catch {
                                  // Not JSON, render as markdown
                                  return (
                                    <MarkdownRenderer
                                      content={observationContent}
                                    />
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          );

        case "tool_call":
          const isExpanded = expandedToolCalls[index] || false;
          return (
            <div
              key={index}
              className="mb-4 border border-blue-200 rounded-lg bg-blue-50"
            >
              <div
                className="flex items-center justify-between px-4 py-2 cursor-pointer select-none hover:bg-blue-100 rounded-t-lg"
                onClick={() => toggleToolCall(index)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-semibold text-blue-800">
                    Tool Call: {block.toolName} {isExpanded ? "▼" : "▶"}
                  </span>
                </div>
                <span className="text-xs text-blue-600">
                  Click to {isExpanded ? "collapse" : "expand"}
                </span>
              </div>

              {isExpanded && (
                <div className="p-4 pt-0">
                  {block.reasoning && (
                    <div className="mb-3 text-sm text-gray-700">
                      <MarkdownRenderer content={block.reasoning} />
                    </div>
                  )}

                  {block.args && (
                    <div className="bg-white rounded border p-3 mb-3">
                      <div className="text-xs font-medium text-gray-600 mb-1">
                        Arguments:
                      </div>
                      <pre className="text-sm overflow-x-auto text-gray-800 whitespace-pre-wrap break-all max-w-full lg:max-w-3xl rounded bg-gray-50 p-2">
                        {block.args}
                      </pre>
                    </div>
                  )}

                  {block.toolResult && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <div className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        Tool Result:
                      </div>
                      <div className="text-sm text-gray-800">
                        {/* Check if result looks like JSON for better formatting */}
                        {(() => {
                          try {
                            const parsed = JSON.parse(block.toolResult);
                            // Check if it's chart data using our utility function
                            if (isChartData(block.toolResult)) {
                              return (
                                <div className="bg-white rounded border p-2 mt-2">
                                  <div className="text-xs text-gray-600 mb-2">
                                    📊 Chart detected in result:
                                  </div>
                                  <SmartChart chartData={parsed} />
                                </div>
                              );
                            }
                            // Regular JSON formatting
                            return (
                              <pre className="whitespace-pre-wrap overflow-x-auto break-all max-w-full lg:max-w-3xl rounded bg-gray-50 p-2">
                                {JSON.stringify(parsed, null, 2)}
                              </pre>
                            );
                          } catch {
                            // Not JSON, render as markdown
                            return (
                              <MarkdownRenderer content={block.toolResult} />
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );

        case "chart":
          return (
            <div key={index} className="mb-4">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-semibold text-green-800">
                    {block.toolName
                      ? `Chart from ${block.toolName}`
                      : "Chart Visualization"}
                  </span>
                </div>
                {block.reasoning && (
                  <div className="text-xs text-gray-600 mb-2">
                    {block.reasoning}
                  </div>
                )}
                <div className="bg-white rounded border p-2">
                  <SmartChart chartData={block.content} />
                </div>
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    const blocks = parseStructuredContent(content);

    // Add charts from tool executions
    const toolExecutionCharts = detectChartsInToolExecutions();
    blocks.push(...toolExecutionCharts);

    // Add separate chart data if provided
    if (chartData) {
      blocks.push({
        type: "chart",
        content:
          typeof chartData === "string"
            ? chartData
            : JSON.stringify(chartData, null, 2),
      });
    }

    return (
      <div className={`structured-response ${className}`}>
        {blocks.map((block, index) => renderBlock(block, index))}
      </div>
    );
  }
);

export default StructuredResponseRenderer;
