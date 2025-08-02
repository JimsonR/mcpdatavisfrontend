// Test the current parser behavior with mixed content
const testContent = `I'll help you analyze this data step by step.

<thinking>
Let me first understand what data we're working with and what kind of analysis would be most useful.
</thinking>

First, let me load the data to see its structure:

<tool_use>
{
  "tool_name": "load_csv",
  "args": {"csv_path": "/path/to/data.csv"}
}
</tool_use>

Now that I can see the data structure, let me explore the key patterns:

<thinking>
The data shows several interesting columns. I should focus on the most relevant ones for analysis.
</thinking>

Let me create a visualization to better understand the trends:

<tool_use>
{
  "tool_name": "create_chart", 
  "args": {"chart_type": "line", "data": {...}}
}
</tool_use>

Based on this analysis, I can see clear patterns emerging. The data shows...

<final_answer>
Here are the key insights from the analysis:
1. Primary trend shows increasing values
2. Secondary pattern indicates seasonal variation
3. Overall conclusion supports the hypothesis
</final_answer>`;

// Test current parser
console.log("=== Testing Current Parser ===");

// Simulate the regex parsing approach
const allBlocksRegex =
  /<(tool_use|tool_call|thinking|thought|result|final_answer|error|action|action_input|observation)>(.*?)<\/\1>/gs;

const matches = [];
let match;
while ((match = allBlocksRegex.exec(testContent)) !== null) {
  matches.push({
    start: match.index,
    end: match.index + match[0].length,
    type: match[1],
    content: match[2].trim(),
  });
}

console.log("Found structured blocks:", matches.length);

// Process text and blocks sequentially
const blocks = [];
let currentIndex = 0;
let position = 0;

for (const currentMatch of matches) {
  // Add text before this block
  if (currentMatch.start > currentIndex) {
    const textBefore = testContent
      .slice(currentIndex, currentMatch.start)
      .trim();
    if (textBefore) {
      blocks.push({
        type: "text",
        content: textBefore,
        position: position++,
      });
    }
  }

  // Add the structured block
  blocks.push({
    type: currentMatch.type,
    content: currentMatch.content,
    position: position++,
  });

  currentIndex = currentMatch.end;
}

// Add remaining text
if (currentIndex < testContent.length) {
  const remainingText = testContent.slice(currentIndex).trim();
  if (remainingText) {
    blocks.push({
      type: "text",
      content: remainingText,
      position: position++,
    });
  }
}

console.log("\n=== Parsed Blocks ===");
blocks.forEach((block, i) => {
  console.log(`${i + 1}. Type: ${block.type}`);
  console.log(
    `   Content: ${block.content.substring(0, 100)}${
      block.content.length > 100 ? "..." : ""
    }`
  );
  console.log(`   Position: ${block.position}\n`);
});

console.log(`Total blocks: ${blocks.length}`);
console.log(`Text blocks: ${blocks.filter((b) => b.type === "text").length}`);
console.log(
  `Structured blocks: ${blocks.filter((b) => b.type !== "text").length}`
);
