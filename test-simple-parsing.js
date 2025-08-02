// Simple test to understand the issue
const testContent1 = `I need to analyze this data step by step.

<tool_use>
<action>load_data</action>
<action_input>{"file": "data.csv"}</action_input>
<observation>{"status": "loaded", "rows": 1000}</observation>
</tool_use>

Now I can see the data structure. Let me explore it further.

<tool_use>
<action>analyze_data</action>
<action_input>{"operation": "summary"}</action_input>
<observation>{"mean": 45.6, "std": 12.3}</observation>
</tool_use>

Based on this analysis, I can conclude that the data shows...`;

// Manual parsing test
console.log("=== Manual Parsing Test ===");

const toolUseRegex = /<tool_use>(.*?)<\/tool_use>/gs;
const matches = [];
let match;

while ((match = toolUseRegex.exec(testContent1)) !== null) {
  matches.push({
    start: match.index,
    end: match.index + match[0].length,
    content: match[1].trim(),
  });
}

console.log(`Found ${matches.length} tool_use blocks`);

// Process sequentially
const blocks = [];
let currentIndex = 0;
let position = 0;

for (const currentMatch of matches) {
  // Add text before this block
  if (currentMatch.start > currentIndex) {
    const textBefore = testContent1
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
    type: "tool_use",
    content: currentMatch.content,
    position: position++,
  });

  currentIndex = currentMatch.end;
}

// Add remaining text
if (currentIndex < testContent1.length) {
  const remainingText = testContent1.slice(currentIndex).trim();
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
    `   Content: "${block.content.substring(0, 100)}${
      block.content.length > 100 ? "..." : ""
    }"`
  );
  console.log(`   Length: ${block.content.length} chars\n`);
});

// Check the flow
console.log("=== Flow Analysis ===");
for (let i = 0; i < blocks.length; i++) {
  const block = blocks[i];
  if (i > 0) {
    const prev = blocks[i - 1];
    console.log(`${prev.type} → ${block.type}`);
  }
}

const hasNaturalFlow = blocks.some(
  (block, i) =>
    block.type === "text" &&
    i > 0 &&
    blocks[i - 1].type === "tool_use" &&
    block.content.length > 10
);

console.log(
  `\nNatural reasoning flow preserved: ${hasNaturalFlow ? "✓ YES" : "❌ NO"}`
);
