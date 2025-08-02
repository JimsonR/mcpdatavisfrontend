// Test the exact format from your backend
const backendTestContent = `I'll help you analyze the sales data step by step.

<thought>
Let me start by examining the structure of this data. I need to understand what columns are available and the data types before proceeding with the analysis.
</thought>

Let me begin by loading your sales data:

<tool_use>
<action>load_csv</action>
<action_input>{"csv_path": "sales_data.csv", "df_name": "sales"}</action_input>
<observation>{"status": "success", "shape": [1000, 8], "columns": ["date", "product", "category", "sales_amount", "quantity", "region", "customer_id", "discount"]}</observation>
</tool_use>

Great! Now I can see we have comprehensive sales data with 1000 records across 8 key dimensions.

<thought>
The data looks well-structured with all the essential fields for sales analysis. I should now explore the data distribution and look for patterns in sales performance across different dimensions like time, region, and product categories.
</thought>

Let me explore the data patterns:

<tool_use>
<action>run_script</action>
<action_input>
{
  "script": "# Simple analysis script",
  "save_to_memory": ["analysis_summary"]
}
</action_input>
<observation>
Sales Data Overview:
Shape: (1000, 8)
Date range: 2023-01-01 to 2023-12-31
Total sales: $245,670.89
Average order value: $245.67

Top Regions by Sales:
North    65,432.10
West     58,901.23
East     56,789.45
South    64,548.11
Name: sales_amount, dtype: float64
</observation>
</tool_use>

The analysis reveals strong performance across all regions with fairly balanced distribution.

<final_answer>
Based on my analysis of your sales data, here are the key insights:

## Data Overview
- **Dataset**: 1,000 transactions spanning the full year 2023
- **Total Revenue**: $245,670.89
- **Average Order Value**: $245.67

## Regional Performance
The sales are well-distributed across regions:
- **North Region**: $65,432.10 (26.6%)
- **South Region**: $64,548.11 (26.3%) 
- **West Region**: $58,901.23 (24.0%)
- **East Region**: $56,789.45 (23.1%)

## Key Findings
1. **Balanced Growth**: All regions show healthy performance with no single region dominating
2. **Consistent AOV**: The $245.67 average order value suggests a stable customer base
3. **Full Year Coverage**: Complete data for 2023 enables comprehensive trend analysis

This foundation provides excellent opportunity for deeper analysis into seasonal patterns, product performance, and customer segmentation strategies.
</final_answer>`;

console.log("=== Testing Backend Format ===");

// Simple parsing test
const toolUseRegex = /<tool_use>(.*?)<\/tool_use>/gs;
const thoughtRegex = /<thought>(.*?)<\/thought>/gs;
const finalAnswerRegex = /<final_answer>(.*?)<\/final_answer>/gs;

const toolUseMatches = [...backendTestContent.matchAll(toolUseRegex)];
const thoughtMatches = [...backendTestContent.matchAll(thoughtRegex)];
const finalAnswerMatches = [...backendTestContent.matchAll(finalAnswerRegex)];

console.log(`Found ${toolUseMatches.length} tool_use blocks`);
console.log(`Found ${thoughtMatches.length} thought blocks`);
console.log(`Found ${finalAnswerMatches.length} final_answer blocks`);

// Test the mixed content parsing
const allBlocksRegex =
  /<(tool_use|tool_call|thinking|thought|result|final_answer|error|action|action_input|observation)>(.*?)<\/\1>/gs;

const allMatches = [];
let match;
while ((match = allBlocksRegex.exec(backendTestContent)) !== null) {
  allMatches.push({
    start: match.index,
    end: match.index + match[0].length,
    type: match[1],
    content: match[2].trim().substring(0, 100) + "...",
  });
}

console.log(`\n=== All Structured Blocks (${allMatches.length}) ===`);
allMatches.forEach((m, i) => {
  console.log(`${i + 1}. ${m.type} at position ${m.start}`);
});

// Test sequential parsing
const blocks = [];
let currentIndex = 0;
let position = 0;

const sortedMatches = allMatches.sort((a, b) => a.start - b.start);

for (const currentMatch of sortedMatches) {
  // Add text before this block
  if (currentMatch.start > currentIndex) {
    const textBefore = backendTestContent
      .slice(currentIndex, currentMatch.start)
      .trim();
    if (textBefore) {
      blocks.push({
        type: "text",
        content: textBefore.substring(0, 80) + "...",
        position: position++,
      });
    }
  }

  blocks.push({
    type: currentMatch.type,
    content: currentMatch.content,
    position: position++,
  });

  currentIndex = currentMatch.end;
}

// Add remaining text
if (currentIndex < backendTestContent.length) {
  const remainingText = backendTestContent.slice(currentIndex).trim();
  if (remainingText) {
    blocks.push({
      type: "text",
      content: remainingText.substring(0, 80) + "...",
      position: position++,
    });
  }
}

console.log(`\n=== Sequential Parsing Result ===`);
console.log(`Total blocks: ${blocks.length}`);
console.log(`Text blocks: ${blocks.filter((b) => b.type === "text").length}`);
console.log(
  `Structured blocks: ${blocks.filter((b) => b.type !== "text").length}`
);

console.log(`\n=== Block Flow ===`);
blocks.forEach((block, i) => {
  console.log(`${i + 1}. ${block.type} (pos: ${block.position})`);
});

// Check for reasoning preservation
const hasReasoningFlow = blocks.some(
  (block, i) =>
    block.type === "text" &&
    i > 0 &&
    i < blocks.length - 1 &&
    (blocks[i - 1].type === "tool_use" || blocks[i - 1].type === "thought") &&
    block.content.length > 20
);

console.log(`\n=== Analysis ===`);
console.log(
  `Reasoning flow preserved: ${hasReasoningFlow ? "✓ YES" : "❌ NO"}`
);
console.log(
  `Natural conversation flow: ${
    blocks.filter((b) => b.type === "text").length >= 3 ? "✓ YES" : "❌ NO"
  }`
);
