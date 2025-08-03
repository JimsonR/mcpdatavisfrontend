/**
 * Streaming JSON Parser Utility
 * Handles partial JSON chunks and validates complete JSON objects
 */

export interface ParsedStreamMessage {
  type: string;
  data: any;
  raw: string;
}

export class StreamingJsonParser {
  private buffer: string = "";
  private processedLines: number = 0;

  /**
   * Add chunk to buffer and process complete JSON objects
   */
  processChunk(chunk: string): ParsedStreamMessage[] {
    console.log(
      `📦 StreamingJsonParser: Processing chunk ${this.processedLines + 1}:`,
      {
        chunkSize: chunk.length,
        bufferSize: this.buffer.length,
        preview: chunk.substring(0, 50) + (chunk.length > 50 ? "..." : ""),
      }
    );

    // Add chunk to buffer
    this.buffer += chunk;

    // Split by newlines to get potential JSON objects
    const lines = this.buffer.split("\n");

    // Keep the last line in buffer (might be incomplete)
    this.buffer = lines.pop() || "";

    const results: ParsedStreamMessage[] = [];

    // Process each complete line
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        this.processedLines++;

        const parseResult = this.tryParseJson(trimmedLine);
        if (parseResult) {
          console.log(
            `✅ StreamingJsonParser: Parsed line ${this.processedLines}:`,
            parseResult.type
          );
          results.push(parseResult);
        } else {
          console.warn(
            `⚠️ StreamingJsonParser: Failed to parse line ${this.processedLines}:`,
            {
              line:
                trimmedLine.substring(0, 100) +
                (trimmedLine.length > 100 ? "..." : ""),
              length: trimmedLine.length,
            }
          );
        }
      }
    }

    return results;
  }

  /**
   * Process any remaining data in buffer (call at end of stream)
   */
  flush(): ParsedStreamMessage[] {
    const results: ParsedStreamMessage[] = [];

    if (this.buffer.trim()) {
      console.log("🔄 StreamingJsonParser: Flushing final buffer:", {
        bufferSize: this.buffer.length,
        preview:
          this.buffer.substring(0, 100) +
          (this.buffer.length > 100 ? "..." : ""),
      });

      const parseResult = this.tryParseJson(this.buffer.trim());
      if (parseResult) {
        console.log(
          "✅ StreamingJsonParser: Final buffer parsed successfully:",
          parseResult.type
        );
        results.push(parseResult);
      } else {
        // If not valid JSON, check if it's meaningful text content
        const content = this.buffer.trim();
        if (content && !this.looksLikeIncompleteJson(content)) {
          console.log("📝 StreamingJsonParser: Adding buffer as text content");
          results.push({
            type: "content",
            data: content,
            raw: content,
          });
        } else {
          console.warn(
            "⚠️ StreamingJsonParser: Final buffer appears to be incomplete JSON"
          );
        }
      }

      this.buffer = "";
    }

    return results;
  }

  /**
   * Try to parse a line as JSON
   */
  private tryParseJson(line: string): ParsedStreamMessage | null {
    try {
      const parsed = JSON.parse(line);

      // Validate that it has the expected structure
      if (typeof parsed === "object" && parsed !== null && "type" in parsed) {
        return {
          type: parsed.type,
          data: parsed.data || parsed,
          raw: line,
        };
      } else {
        console.warn(
          "⚠️ StreamingJsonParser: JSON object missing 'type' field:",
          parsed
        );
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if content looks like incomplete JSON
   */
  private looksLikeIncompleteJson(content: string): boolean {
    // Check for typical incomplete JSON patterns
    const incompletePatterns = [
      /^\s*\{[^}]*$/, // Starts with { but no closing }
      /^\s*\[[^\]]*$/, // Starts with [ but no closing ]
      /^\s*"[^"]*$/, // Starts with " but no closing "
      /,\s*$/, // Ends with comma
      /:\s*$/, // Ends with colon
    ];

    return incompletePatterns.some((pattern) => pattern.test(content));
  }

  /**
   * Get parser statistics
   */
  getStats() {
    return {
      processedLines: this.processedLines,
      bufferSize: this.buffer.length,
      hasBufferedContent: this.buffer.trim().length > 0,
    };
  }

  /**
   * Reset parser state
   */
  reset() {
    this.buffer = "";
    this.processedLines = 0;
    console.log("🔄 StreamingJsonParser: Reset");
  }
}

/**
 * Legacy utility function for backward compatibility
 */
export function processStreamingJsonChunk(
  chunk: string,
  buffer: string
): {
  newBuffer: string;
  messages: ParsedStreamMessage[];
} {
  const parser = new StreamingJsonParser();
  parser["buffer"] = buffer; // Set initial buffer

  const messages = parser.processChunk(chunk);
  const newBuffer = parser["buffer"];

  return { newBuffer, messages };
}
