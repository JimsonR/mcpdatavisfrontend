import { XMLParser } from "fast-xml-parser";

export interface ParsedBlock {
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
  position: number; // Track original position for ordering
}

export class StructuredContentParser {
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      preserveOrder: true,
      parseTagValue: false,
      trimValues: false,
    });
  }

  /**
   * Parse structured content while preserving order and handling mixed content
   */
  parseStructuredContent(text: string): ParsedBlock[] {
    // For streaming content, regex parsing is often more reliable than XML parsing
    // because the content may be incomplete or malformed during streaming
    return this.fallbackRegexParsing(text);
  }

  private processNodes(
    nodes: any[],
    blocks: ParsedBlock[],
    basePosition: number
  ): void {
    let position = basePosition;

    for (const node of nodes) {
      if (typeof node === "string") {
        // Handle direct text content
        const textContent = node.trim();
        if (textContent) {
          blocks.push({
            type: "text",
            content: textContent,
            position: position++,
          });
        }
      } else if (typeof node === "object" && node !== null) {
        // Handle structured tags and objects
        for (const [tagName, content] of Object.entries(node)) {
          if (tagName === "root") {
            // Process root content recursively
            if (Array.isArray(content)) {
              this.processNodes(content, blocks, position);
            }
          } else if (this.isStructuredTag(tagName)) {
            const block = this.createBlockFromTag(tagName, content, position++);
            if (block) {
              blocks.push(block);
            }
          } else if (tagName === "#text") {
            // Handle XML parser's text nodes
            const textContent = String(content).trim();
            if (textContent) {
              blocks.push({
                type: "text",
                content: textContent,
                position: position++,
              });
            }
          } else {
            // Handle other content - might be text or mixed content
            const textContent = this.extractTextContent(content).trim();
            if (textContent) {
              blocks.push({
                type: "text",
                content: textContent,
                position: position++,
              });
            }
          }
        }
      }
    }
  }

  private isStructuredTag(tagName: string): boolean {
    const structuredTags = [
      "tool_use",
      "tool_call",
      "thinking",
      "thought",
      "result",
      "final_answer",
      "error",
      "action",
      "action_input",
      "observation",
    ];
    return structuredTags.includes(tagName);
  }

  private createBlockFromTag(
    tagName: string,
    content: any,
    position: number
  ): ParsedBlock | null {
    // Extract text content, handling JSON structures if needed
    let textContent: string;

    if (typeof content === "string") {
      textContent = content;
    } else {
      textContent = this.extractTextContent(content);
    }

    switch (tagName) {
      case "tool_use":
        return {
          type: "tool_use",
          content: textContent,
          position,
        };

      case "tool_call":
        return this.parseToolCall(textContent, position);

      case "thinking":
      case "thought":
        return {
          type: "thinking",
          content: textContent,
          position,
        };

      case "result":
        return {
          type: "result",
          content: textContent,
          position,
        };

      case "final_answer":
        return {
          type: "final_answer",
          content: textContent,
          position,
        };

      case "error":
        return {
          type: "error",
          content: textContent,
          position,
        };

      case "action":
        return {
          type: "action",
          content: textContent,
          position,
        };

      case "action_input":
        return {
          type: "action_input",
          content: textContent,
          position,
        };

      case "observation":
        return {
          type: "observation",
          content: textContent,
          position,
        };

      default:
        return null;
    }
  }

  private parseToolCall(content: string, position: number): ParsedBlock {
    const toolNameMatch = content.match(/<tool_name>(.*?)<\/tool_name>/s);
    const argsMatch = content.match(/<args>(.*?)<\/args>/s);
    const toolResultMatch = content.match(/<tool_result>(.*?)<\/tool_result>/s);

    const toolName = toolNameMatch ? toolNameMatch[1].trim() : "Unknown Tool";
    const args = argsMatch ? argsMatch[1].trim() : "";
    const toolResult = toolResultMatch ? toolResultMatch[1].trim() : "";

    // Extract reasoning by removing known tags
    const reasoning = content
      .replace(/<tool_name>.*?<\/tool_name>/gs, "")
      .replace(/<args>.*?<\/args>/gs, "")
      .replace(/<tool_result>.*?<\/tool_result>/gs, "")
      .trim();

    return {
      type: "tool_call",
      content,
      toolName,
      args,
      toolResult,
      reasoning: reasoning || undefined,
      position,
    };
  }

  private extractTextContent(content: any): string {
    if (typeof content === "string") {
      return content;
    }

    if (Array.isArray(content)) {
      return content.map((item) => this.extractTextContent(item)).join("");
    }

    if (typeof content === "object" && content !== null) {
      // Handle XML parser's #text structure
      if (content["#text"]) {
        return content["#text"];
      }

      // Handle objects with text content
      if (typeof content === "object") {
        let textContent = "";

        // Look for #text properties recursively
        for (const [key, value] of Object.entries(content)) {
          if (key === "#text" && typeof value === "string") {
            textContent += value;
          } else if (key !== "#text") {
            textContent += this.extractTextContent(value);
          }
        }

        return textContent || JSON.stringify(content);
      }
    }

    return String(content);
  }

  /**
   * Regex-based parsing for reliable handling of streaming content
   */
  private fallbackRegexParsing(text: string): ParsedBlock[] {
    const blocks: ParsedBlock[] = [];
    let position = 0;
    let currentIndex = 0;

    // Combined regex for all structured tags
    const allBlocksRegex =
      /<(tool_use|tool_call|thinking|thought|result|final_answer|error|action|action_input|observation)>(.*?)<\/\1>/gs;

    const matches: Array<{
      start: number;
      end: number;
      type: string;
      content: string;
    }> = [];

    let match;
    while ((match = allBlocksRegex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: match[1],
        content: match[2].trim(),
      });
    }

    // Process text and blocks sequentially
    for (const currentMatch of matches) {
      // Add text before this block
      if (currentMatch.start > currentIndex) {
        const textBefore = text.slice(currentIndex, currentMatch.start).trim();
        if (textBefore) {
          blocks.push({
            type: "text",
            content: textBefore,
            position: position++,
          });
        }
      }

      // Process the content and handle JSON structures like {"#text": "..."}
      let processedContent = currentMatch.content;

      // Check if content looks like JSON with #text property
      try {
        const parsed = JSON.parse(processedContent);
        if (parsed && typeof parsed === "object" && parsed["#text"]) {
          processedContent = parsed["#text"];
          console.log("Extracted #text content:", processedContent); // Debug log
        }
      } catch {
        // Not JSON, use content as-is
        console.log("Content is not JSON, using as-is:", processedContent); // Debug log
      }

      // Add the structured block
      const block = this.createBlockFromTag(
        currentMatch.type,
        processedContent,
        position++
      );
      if (block) {
        blocks.push(block);
      }

      currentIndex = currentMatch.end;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex).trim();
      if (remainingText) {
        blocks.push({
          type: "text",
          content: remainingText,
          position: position++,
        });
      }
    }

    return blocks;
  }

  /**
   * Detect if text contains chart data
   */
  isChartData(text: string): boolean {
    try {
      const parsed = JSON.parse(text);
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
  }

  /**
   * Process text content for charts
   */
  processTextForCharts(textContent: string): ParsedBlock[] {
    const blocks: ParsedBlock[] = [];
    const chartDataRegex = /```(?:json|javascript|js)\s*\n([\s\S]*?)\n```/g;
    let lastIndex = 0;
    let position = 0;
    let chartMatch;

    while ((chartMatch = chartDataRegex.exec(textContent)) !== null) {
      // Add text before chart
      const beforeChart = textContent.slice(lastIndex, chartMatch.index).trim();
      if (beforeChart) {
        blocks.push({
          type: "text",
          content: beforeChart,
          position: position++,
        });
      }

      // Try to parse as chart data
      try {
        const chartData = chartMatch[1].trim();
        if (this.isChartData(chartData)) {
          blocks.push({
            type: "chart",
            content: chartData,
            position: position++,
          });
        } else {
          blocks.push({
            type: "text",
            content: "```json\n" + chartData + "\n```",
            position: position++,
          });
        }
      } catch {
        blocks.push({
          type: "text",
          content: chartMatch[0],
          position: position++,
        });
      }

      lastIndex = chartMatch.index + chartMatch[0].length;
    }

    // Add remaining text
    const afterCharts = textContent.slice(lastIndex).trim();
    if (afterCharts) {
      blocks.push({
        type: "text",
        content: afterCharts,
        position: position++,
      });
    }

    return blocks;
  }
}
