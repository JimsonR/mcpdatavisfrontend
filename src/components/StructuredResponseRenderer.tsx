import React, { useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import SmartChart from "./SmartChart";

interface StructuredResponseRendererProps {
  content: string;
  className?: string;
  chartData?: any;
  toolExecutions?: any[];
}

interface ParsedBlock {
  type: "text" | "tool_call" | "chart" | "thinking" | "result";
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

    const toggleToolCall = (index: number) => {
      setExpandedToolCalls((prev) => ({
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
      const blocks: ParsedBlock[] = [];

      // Handle thinking blocks
      const thinkingRegex = /<thinking>(.*?)<\/thinking>/gs;
      let processedText = text.replace(thinkingRegex, (_, thinkingContent) => {
        blocks.push({
          type: "thinking",
          content: thinkingContent.trim(),
        });
        return "<!THINKING_BLOCK!>"; // Placeholder to maintain position
      });

      // Handle result blocks
      const resultRegex = /<result>(.*?)<\/result>/gs;
      processedText = processedText.replace(resultRegex, (_, resultContent) => {
        blocks.push({
          type: "result",
          content: resultContent.trim(),
        });
        return "<!RESULT_BLOCK!>"; // Placeholder to maintain position
      });

      // Split by tool call blocks
      const toolCallRegex = /<tool_call>(.*?)<\/tool_call>/gs;
      const parts = processedText.split(toolCallRegex);

      let blockIndex = 0;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        if (i % 2 === 0) {
          // This is text content between tool calls
          if (part.trim()) {
            // Handle thinking and result placeholders
            const segments = part.split(/<!(?:THINKING|RESULT)_BLOCK!>/);

            for (const segment of segments) {
              if (segment.trim()) {
                // Check if this text contains chart data
                const chartDataRegex =
                  /```(?:json|javascript|js)\s*\n([\s\S]*?)\n```/g;
                let lastIndex = 0;
                let match;

                while ((match = chartDataRegex.exec(segment)) !== null) {
                  // Add text before chart
                  const beforeChart = segment.slice(lastIndex, match.index);
                  if (beforeChart.trim()) {
                    blocks.splice(blockIndex++, 0, {
                      type: "text",
                      content: beforeChart.trim(),
                    });
                  }

                  // Try to parse as chart data
                  try {
                    const chartData = match[1].trim();
                    // Use the isChartData function for better detection
                    if (isChartData(chartData)) {
                      blocks.splice(blockIndex++, 0, {
                        type: "chart",
                        content: chartData,
                      });
                    } else {
                      // Regular code block
                      blocks.splice(blockIndex++, 0, {
                        type: "text",
                        content: "```json\n" + chartData + "\n```",
                      });
                    }
                  } catch {
                    // If parsing fails, treat as regular code block
                    blocks.splice(blockIndex++, 0, {
                      type: "text",
                      content: match[0],
                    });
                  }

                  lastIndex = match.index + match[0].length;
                }

                // Add remaining text after last chart
                const afterCharts = segment.slice(lastIndex);
                if (afterCharts.trim()) {
                  blocks.splice(blockIndex++, 0, {
                    type: "text",
                    content: afterCharts.trim(),
                  });
                }
              }
            }
          }
        } else {
          // This is inside a tool call block
          const toolNameMatch = part.match(/<tool_name>(.*?)<\/tool_name>/s);
          const argsMatch = part.match(/<args>(.*?)<\/args>/s);
          const toolResultMatch = part.match(
            /<tool_result>(.*?)<\/tool_result>/s
          );

          const toolName = toolNameMatch
            ? toolNameMatch[1].trim()
            : "Unknown Tool";
          const args = argsMatch ? argsMatch[1].trim() : "";
          const toolResult = toolResultMatch ? toolResultMatch[1].trim() : "";

          // Extract any reasoning or explanation text
          let reasoning = part
            .replace(/<tool_name>.*?<\/tool_name>/s, "")
            .replace(/<args>.*?<\/args>/s, "")
            .replace(/<tool_result>.*?<\/tool_result>/s, "")
            .trim();

          blocks.splice(blockIndex++, 0, {
            type: "tool_call",
            content: part,
            toolName,
            args,
            toolResult,
            reasoning: reasoning || undefined,
          });
        }
      }

      return blocks.sort((a, b) => {
        // Maintain original order but ensure thinking comes first if present
        if (a.type === "thinking" && b.type !== "thinking") return -1;
        if (b.type === "thinking" && a.type !== "thinking") return 1;
        return 0;
      });
    };

    const renderBlock = (block: ParsedBlock, index: number) => {
      switch (block.type) {
        case "text":
          return (
            <div key={index} className="mb-4">
              <MarkdownRenderer content={block.content} />
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
