// import { XMLParser } from "fast-xml-parser";

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
  // private xmlParser: XMLParser;

  constructor() {
    // this.xmlParser = new XMLParser({
    //   ignoreAttributes: false,
    //   preserveOrder: true,
    //   parseTagValue: false,
    //   trimValues: false,
    // });
  }

  /**
   * Parse structured content while preserving order and handling mixed content
   * Uses a state machine approach for better streaming support
   */
  parseStructuredContent(text: string): ParsedBlock[] {
    // Add comprehensive logging for debugging
    console.log("📊 StructuredContentParser received text:", {
      length: text.length,
      preview: text.substring(0, 200) + (text.length > 200 ? "..." : ""),
      hasStructuredTags:
        /<(tool_use|tool_call|thinking|result|action|observation|final_answer|error)>/i.test(
          text
        ),
      hasHtmlDetails: /<details>/i.test(text),
      hasMarkdownSections: /## 🤔|## 🎯/.test(text),
      textType: this.detectContentType(text),
    });

    try {
      // Check if this is streaming structured agent format (HTML details + markdown sections)
      if (this.isStreamingStructuredFormat(text)) {
        console.log("📊 Using streaming structured format parsing");
        const result = this.parseStreamingStructuredContent(text);
        console.log(
          "📊 Streaming structured parsing succeeded, blocks:",
          result.length
        );
        return result;
      }

      // Try state machine parsing first (more robust for streaming XML-like content)
      console.log("📊 Using state machine parsing for structured content");
      const result = this.stateMachineParsing(text);
      console.log("📊 State machine parsing succeeded, blocks:", result.length);
      return result;
    } catch (error) {
      console.warn(
        "❌ State machine parsing failed, falling back to regex:",
        error
      );
      console.log("📊 Falling back to regex parsing for structured content");
      // Fallback to regex for edge cases
      const result = this.fallbackRegexParsing(text);
      console.log("📊 Regex parsing completed, blocks:", result.length);
      return result;
    }
  }

  /**
   * Detect the type of content being parsed for debugging
   */
  private detectContentType(text: string): string {
    if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
      return "JSON-like";
    }
    if (/<[a-zA-Z_]+>/i.test(text)) {
      return "XML/HTML-like";
    }
    if (text.includes("```")) {
      return "Markdown-like";
    }
    return "Plain text";
  }

  /**
   * State machine parser - more robust for streaming and incomplete content
   */
  private stateMachineParsing(text: string): ParsedBlock[] {
    console.log("🔍 State machine parsing input:", {
      length: text.length,
      startsWithTag: /<[a-zA-Z_]+>/i.test(text.substring(0, 50)),
      endsWithTag: /<\/[a-zA-Z_]+>$/i.test(text.substring(text.length - 50)),
      preview: text.substring(0, 100),
    });

    const blocks: ParsedBlock[] = [];
    let position = 0;
    let i = 0;
    let processedTags = 0;

    while (i < text.length) {
      const openTag = this.findNextOpenTag(text, i);

      if (!openTag) {
        // No more structured tags, add remaining text
        const remainingText = text.slice(i).trim();
        if (remainingText) {
          console.log(
            "📝 Adding remaining text:",
            remainingText.substring(0, 50) + "..."
          );
          blocks.push({
            type: "text",
            content: remainingText,
            position: position++,
          });
        }
        break;
      }

      console.log(
        "🏷️ Found open tag:",
        openTag.tagName,
        "at position",
        openTag.start
      );

      // Add text before the tag
      if (openTag.start > i) {
        const textBefore = text.slice(i, openTag.start).trim();
        if (textBefore) {
          console.log(
            "📝 Adding text before tag:",
            textBefore.substring(0, 50) + "..."
          );
          blocks.push({
            type: "text",
            content: textBefore,
            position: position++,
          });
        }
      }

      // Find the matching closing tag
      const closeTag = this.findMatchingCloseTag(text, openTag);

      if (closeTag) {
        // Extract content between tags
        const content = text.slice(openTag.end, closeTag.start);
        console.log(
          "✅ Found complete tag pair:",
          openTag.tagName,
          "content length:",
          content.length
        );

        const block = this.createBlockFromTag(
          openTag.tagName,
          content,
          position++
        );

        if (block) {
          blocks.push(block);
          processedTags++;
        }

        i = closeTag.end;
      } else {
        // No matching close tag found (streaming/incomplete)
        console.warn(
          "⚠️ No closing tag found for:",
          openTag.tagName,
          "treating as text"
        );
        const textContent = text.slice(openTag.start).trim();
        if (textContent) {
          blocks.push({
            type: "text",
            content: textContent,
            position: position++,
          });
        }
        break;
      }
    }

    console.log("📊 State machine parsing completed:", {
      totalBlocks: blocks.length,
      processedTags: processedTags,
      blockTypes: blocks.map((b) => b.type),
    });

    return blocks;
  }

  private findNextOpenTag(
    text: string,
    startIndex: number
  ): { start: number; end: number; tagName: string } | null {
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

    let closestMatch: { start: number; end: number; tagName: string } | null =
      null;

    for (const tag of structuredTags) {
      const regex = new RegExp(`<${tag}(?:\\s[^>]*)?>`, "i");
      const match = regex.exec(text.slice(startIndex));

      if (
        match &&
        (!closestMatch || match.index < closestMatch.start - startIndex)
      ) {
        closestMatch = {
          start: startIndex + match.index,
          end: startIndex + match.index + match[0].length,
          tagName: tag,
        };
      }
    }

    return closestMatch;
  }

  private findMatchingCloseTag(
    text: string,
    openTag: { tagName: string; end: number }
  ): { start: number; end: number } | null {
    const closeTagRegex = new RegExp(`</${openTag.tagName}>`, "i");
    const match = closeTagRegex.exec(text.slice(openTag.end));

    if (match) {
      return {
        start: openTag.end + match.index,
        end: openTag.end + match.index + match[0].length,
      };
    }

    return null;
  }

  // private processNodes(
  //   nodes: any[],
  //   blocks: ParsedBlock[],
  //   basePosition: number
  // ): void {
  //   let position = basePosition;

  //   for (const node of nodes) {
  //     if (typeof node === "string") {
  //       // Handle direct text content
  //       const textContent = node.trim();
  //       if (textContent) {
  //         blocks.push({
  //           type: "text",
  //           content: textContent,
  //           position: position++,
  //         });
  //       }
  //     } else if (typeof node === "object" && node !== null) {
  //       // Handle structured tags and objects
  //       for (const [tagName, content] of Object.entries(node)) {
  //         if (tagName === "root") {
  //           // Process root content recursively
  //           if (Array.isArray(content)) {
  //             this.processNodes(content, blocks, position);
  //           }
  //         } else if (this.isStructuredTag(tagName)) {
  //           const block = this.createBlockFromTag(tagName, content, position++);
  //           if (block) {
  //             blocks.push(block);
  //           }
  //         } else if (tagName === "#text") {
  //           // Handle XML parser's text nodes
  //           const textContent = String(content).trim();
  //           if (textContent) {
  //             blocks.push({
  //               type: "text",
  //               content: textContent,
  //               position: position++,
  //             });
  //           }
  //         } else {
  //           // Handle other content - might be text or mixed content
  //           const textContent = this.extractTextContent(content).trim();
  //           if (textContent) {
  //             blocks.push({
  //               type: "text",
  //               content: textContent,
  //               position: position++,
  //             });
  //           }
  //         }
  //       }
  //     }
  //   }
  // }

  // private isStructuredTag(tagName: string): boolean {
  //   const structuredTags = [
  //     "tool_use",
  //     "tool_call",
  //     "thinking",
  //     "thought",
  //     "result",
  //     "final_answer",
  //     "error",
  //     "action",
  //     "action_input",
  //     "observation",
  //   ];
  //   return structuredTags.includes(tagName);
  // }

  /**
   * Check if text is in streaming structured format (HTML details + markdown sections)
   */
  private isStreamingStructuredFormat(text: string): boolean {
    // Look for HTML details blocks and markdown sections characteristic of streaming structured mode
    return (
      text.includes("<details>") ||
      text.includes("## 🤔 Thinking") ||
      text.includes("## 🎯 Final Answer") ||
      (text.includes("**Arguments:**") && text.includes("**Result:**"))
    );
  }

  /**
   * Parse streaming structured content (HTML details + markdown)
   */
  private parseStreamingStructuredContent(text: string): ParsedBlock[] {
    console.log("🔍 Parsing streaming structured content:", {
      length: text.length,
      hasDetails: text.includes("<details>"),
      hasThinking: text.includes("## 🤔 Thinking"),
      hasFinalAnswer: text.includes("## 🎯 Final Answer"),
    });

    const blocks: ParsedBlock[] = [];
    let position = 0;
    let currentIndex = 0;

    // Regex patterns for different section types
    const thinkingRegex =
      /## 🤔 Thinking \(Step \d+\)\n\n([\s\S]*?)(?=\n## |<details>|## 🎯|\n\n<details>|$)/g;
    const finalAnswerRegex =
      /## 🎯 Final Answer\n\n([\s\S]*?)(?=\n## |<details>|$)/g;
    const detailsRegex =
      /<details>\s*<summary>🔧 <strong>Tool: ([^<]+)<\/strong>[^<]*<\/summary>\s*([\s\S]*?)<\/details>/g;

    // Find all sections and their positions
    const sections: Array<{
      start: number;
      end: number;
      type: string;
      content: string;
      toolName?: string;
    }> = [];

    // Find thinking sections
    let match;
    while ((match = thinkingRegex.exec(text)) !== null) {
      sections.push({
        start: match.index,
        end: match.index + match[0].length,
        type: "thinking",
        content: match[1].trim(),
      });
    }

    // Reset regex lastIndex
    thinkingRegex.lastIndex = 0;

    // Find final answer sections
    while ((match = finalAnswerRegex.exec(text)) !== null) {
      sections.push({
        start: match.index,
        end: match.index + match[0].length,
        type: "final_answer",
        content: match[1].trim(),
      });
    }

    // Reset regex lastIndex
    finalAnswerRegex.lastIndex = 0;

    // Find tool details sections
    while ((match = detailsRegex.exec(text)) !== null) {
      sections.push({
        start: match.index,
        end: match.index + match[0].length,
        type: "tool_use",
        content: match[2].trim(),
        toolName: match[1].trim(),
      });
    }

    // Sort sections by start position
    sections.sort((a, b) => a.start - b.start);

    console.log(
      "📋 Found sections:",
      sections.map((s) => ({
        type: s.type,
        start: s.start,
        toolName: s.toolName,
      }))
    );

    // Process sections sequentially
    for (const section of sections) {
      // Add text before this section
      if (section.start > currentIndex) {
        const textBefore = text.slice(currentIndex, section.start).trim();
        if (textBefore) {
          console.log(
            "📝 Adding text before section:",
            textBefore.substring(0, 50) + "..."
          );
          blocks.push({
            type: "text",
            content: textBefore,
            position: position++,
          });
        }
      }

      // Process the section
      if (section.type === "thinking") {
        blocks.push({
          type: "thinking",
          content: section.content,
          position: position++,
        });
      } else if (section.type === "final_answer") {
        blocks.push({
          type: "final_answer",
          content: section.content,
          position: position++,
        });
      } else if (section.type === "tool_use") {
        // Parse tool details content
        const toolBlock = this.parseToolDetailsContent(
          section.content,
          section.toolName || "Unknown Tool",
          position++
        );
        blocks.push(toolBlock);
      }

      currentIndex = section.end;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex).trim();
      if (remainingText) {
        console.log(
          "📝 Adding final remaining text:",
          remainingText.substring(0, 50) + "..."
        );
        // Check if remaining text contains chart data
        const chartBlocks = this.processTextForCharts(remainingText);
        for (const chartBlock of chartBlocks) {
          blocks.push({
            ...chartBlock,
            position: position++,
          });
        }
      }
    }

    console.log("📊 Streaming structured parsing completed:", {
      totalBlocks: blocks.length,
      blockTypes: blocks.map((b) => b.type),
    });

    return blocks;
  }

  /**
   * Parse tool details content to extract arguments and results
   */
  private parseToolDetailsContent(
    content: string,
    toolName: string,
    position: number
  ): ParsedBlock {
    const argsMatch = content.match(
      /\*\*Arguments:\*\*\s*```(?:json)?\s*([\s\S]*?)\s*```/
    );
    const resultMatch = content.match(
      /\*\*Result:\*\*\s*```(?:json)?\s*([\s\S]*?)\s*```/
    );

    const args = argsMatch ? argsMatch[1].trim() : "";
    const toolResult = resultMatch ? resultMatch[1].trim() : "";

    console.log("🔧 Parsed tool details:", {
      toolName,
      hasArgs: !!args,
      hasResult: !!toolResult,
      argsLength: args.length,
      resultLength: toolResult.length,
    });

    return {
      type: "tool_use",
      content: content,
      toolName: toolName,
      args: args,
      toolResult: toolResult,
      position: position,
    };
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
    console.log("🔄 Regex parsing input:", {
      length: text.length,
      preview: text.substring(0, 100),
      containsStructuredTags:
        /<(tool_use|tool_call|thinking|thought|result|final_answer|error|action|action_input|observation)>/i.test(
          text
        ),
    });

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
    let matchCount = 0;
    while ((match = allBlocksRegex.exec(text)) !== null) {
      matchCount++;
      console.log(`🎯 Regex match ${matchCount}:`, {
        type: match[1],
        start: match.index,
        contentLength: match[2].length,
        contentPreview:
          match[2].substring(0, 50) + (match[2].length > 50 ? "..." : ""),
      });

      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: match[1],
        content: match[2].trim(),
      });
    }

    console.log("📋 Total regex matches found:", matches.length);

    // Process text and blocks sequentially
    for (const currentMatch of matches) {
      // Add text before this block
      if (currentMatch.start > currentIndex) {
        const textBefore = text.slice(currentIndex, currentMatch.start).trim();
        if (textBefore) {
          console.log(
            "📝 Adding text before block:",
            textBefore.substring(0, 50) + "..."
          );
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
          console.log(
            "🔧 Extracted #text content:",
            processedContent.substring(0, 50) + "..."
          );
        }
      } catch {
        // Not JSON, use content as-is
        console.log("📄 Content is not JSON, using as-is");
      }

      // Add the structured block
      const block = this.createBlockFromTag(
        currentMatch.type,
        processedContent,
        position++
      );
      if (block) {
        console.log(
          "✅ Created block:",
          block.type,
          "at position",
          block.position
        );
        blocks.push(block);
      }

      currentIndex = currentMatch.end;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex).trim();
      if (remainingText) {
        console.log(
          "📝 Adding final remaining text:",
          remainingText.substring(0, 50) + "..."
        );
        blocks.push({
          type: "text",
          content: remainingText,
          position: position++,
        });
      }
    }

    console.log("📊 Regex parsing completed:", {
      totalBlocks: blocks.length,
      blockTypes: blocks.map((b) => b.type),
    });

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
