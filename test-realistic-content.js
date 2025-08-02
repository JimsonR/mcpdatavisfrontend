// Test with a realistic streaming response format
import { StructuredContentParser } from "./src/utils/structuredContentParser.js";

const realisticContent = `I'll help you analyze this sales data to identify trends and insights.

<thinking>
Let me start by loading the data to understand its structure and contents. I'll need to examine the columns and data types first.
</thinking>

Let me begin by loading your sales data:

<tool_use>
<action>load_csv</action>
<action_input>{"csv_path": "sales_data.csv", "df_name": "sales"}</action_input>
<observation>{"status": "success", "shape": [1000, 8], "columns": ["date", "product", "category", "sales_amount", "quantity", "region", "customer_id", "discount"]}</observation>
</tool_use>

Great! I can see we have 1000 rows of sales data with 8 columns. Now let me examine the data more closely to understand the patterns.

<thinking>
The data has good coverage with date, product information, sales amounts, and regional data. I should start with some basic exploratory analysis to understand the distributions and identify any obvious patterns or outliers.
</thinking>

Let me start with some basic exploration:

<tool_use>
<action>run_script</action>
<action_input>
{
  "script": "import pandas as pd\nimport numpy as np\n\n# Basic info about the dataset\nprint('Dataset Overview:')\nprint(f'Shape: {sales.shape}')\nprint(f'Columns: {list(sales.columns)}')\n\n# Check for missing values\nprint('\\nMissing Values:')\nprint(sales.isnull().sum())\n\n# Basic statistics\nprint('\\nBasic Statistics:')\nprint(sales.describe())",
  "save_to_memory": ["summary_stats"]
}
</action_input>
<observation>
{
  "output": "Dataset Overview:\nShape: (1000, 8)\nColumns: ['date', 'product', 'category', 'sales_amount', 'quantity', 'region', 'customer_id', 'discount']\n\nMissing Values:\ndate           0\nproduct        0\ncategory       0\nsales_amount   0\nquantity       0\nregion         0\ncustomer_id    0\ndiscount       5\ndtype: int64\n\nBasic Statistics:\n       sales_amount     quantity      discount\ncount   1000.000000  1000.000000    995.000000\nmean     245.67      12.34         0.08\nstd      125.89       8.91         0.05\nmin       10.50       1.00         0.00\n25%      145.25       6.00         0.05\n50%      235.75      11.00         0.08\n75%      325.80      17.00         0.12\nmax      899.99      45.00         0.25"
}
</observation>
</tool_use>

Excellent! The data looks clean with only 5 missing discount values. Now I can see some interesting patterns emerging.

<thinking>
The sales amounts range from $10.50 to $899.99 with a mean of $245.67. The quantity data shows we're dealing with reasonable order sizes (1-45 items). The discount data suggests most transactions have small discounts (0-25%). 

Next, I should look at sales patterns over time and by category to identify trends.
</thinking>

Now let me analyze sales trends over time:

<tool_use>
<action>create_visualization</action>
<action_input>
{
  "df_name": "sales",
  "plot_type": "line",
  "x": "date",
  "y": "sales_amount",
  "title": "Sales Trends Over Time"
}
</action_input>
<observation>
{
  "chart_data": {
    "type": "line",
    "data": {
      "labels": ["2023-01", "2023-02", "2023-03", "2023-04", "2023-05", "2023-06"],
      "datasets": [{
        "label": "Sales Amount",
        "data": [45000, 52000, 48000, 61000, 58000, 65000],
        "borderColor": "#3B82F6",
        "backgroundColor": "rgba(59, 130, 246, 0.1)"
      }]
    },
    "options": {
      "responsive": true,
      "plugins": {
        "title": {"display": true, "text": "Sales Trends Over Time"}
      }
    }
  }
}
</observation>
</tool_use>

Perfect! I can see a clear upward trend in sales over the 6-month period, with some month-to-month variation but overall growth from $45K to $65K monthly.

<final_answer>
Based on my analysis of your sales data, here are the key insights:

## Data Overview
- **Dataset Size**: 1,000 transactions across 8 key dimensions
- **Data Quality**: Very clean with only 5 missing discount values (0.5%)
- **Time Period**: 6 months of sales data (Jan-Jun 2023)

## Key Findings

### 1. Sales Performance
- **Average Order Value**: $245.67
- **Sales Range**: $10.50 - $899.99  
- **Total Growth**: 44% increase from January ($45K) to June ($65K)
- **Monthly Average**: $54,833

### 2. Customer Behavior
- **Average Quantity**: 12.34 items per transaction
- **Order Size Range**: 1-45 items
- **Discount Usage**: 8% average discount, ranging 0-25%

### 3. Trends
- **Consistent Growth**: Strong upward trajectory with month-over-month improvements
- **Seasonal Patterns**: Some variation but overall positive momentum
- **Customer Engagement**: Healthy mix of order sizes suggests diverse customer base

## Recommendations
1. **Capitalize on Growth**: The 44% growth trend is excellent - maintain current strategies
2. **Inventory Planning**: Prepare for continued growth trajectory 
3. **Discount Strategy**: Current 8% average discount seems effective
4. **Focus Areas**: Investigate what's driving the strong Q2 performance to replicate

The data shows a very healthy, growing business with strong fundamentals and clear upward momentum.
</final_answer>`;

console.log("=== Testing Realistic Content ===");

// Test with the actual parser
const parser = new StructuredContentParser();
const blocks = parser.parseStructuredContent(realisticContent);

console.log(`\nParsed ${blocks.length} blocks:`);

blocks.forEach((block, i) => {
  console.log(`\n${i + 1}. Type: ${block.type} (Position: ${block.position})`);

  if (block.type === "text") {
    console.log(
      `   Content: "${block.content.substring(0, 150)}${
        block.content.length > 150 ? "..." : ""
      }"`
    );
  } else if (block.type === "tool_use") {
    console.log(`   Tool Use Block Length: ${block.content.length} chars`);
    console.log(`   First 100 chars: "${block.content.substring(0, 100)}..."`);
  } else {
    console.log(
      `   Content: "${block.content.substring(0, 100)}${
        block.content.length > 100 ? "..." : ""
      }"`
    );
  }
});

// Count different types
const textBlocks = blocks.filter((b) => b.type === "text").length;
const thinkingBlocks = blocks.filter((b) => b.type === "thinking").length;
const toolUseBlocks = blocks.filter((b) => b.type === "tool_use").length;
const finalAnswerBlocks = blocks.filter(
  (b) => b.type === "final_answer"
).length;

console.log(`\n=== Summary ===`);
console.log(`Text blocks: ${textBlocks}`);
console.log(`Thinking blocks: ${thinkingBlocks}`);
console.log(`Tool use blocks: ${toolUseBlocks}`);
console.log(`Final answer blocks: ${finalAnswerBlocks}`);
console.log(`Total: ${blocks.length}`);

// Check if reasoning is being preserved between structured blocks
console.log(`\n=== Reasoning Flow Check ===`);
let hasReasoningBetweenTools = false;
for (let i = 0; i < blocks.length - 1; i++) {
  const current = blocks[i];
  const next = blocks[i + 1];

  if (
    (current.type === "tool_use" || current.type === "thinking") &&
    next.type === "text" &&
    next.content.length > 20
  ) {
    console.log(
      `✓ Found reasoning after ${current.type}: "${next.content.substring(
        0,
        80
      )}..."`
    );
    hasReasoningBetweenTools = true;
  }
}

if (!hasReasoningBetweenTools) {
  console.log("❌ No substantial reasoning found between structured blocks");
} else {
  console.log("✓ Reasoning between blocks is being preserved");
}
