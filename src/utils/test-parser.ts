import { StructuredContentParser } from "./structuredContentParser";

// Test the parser with the problematic content you're seeing
const testContent = `
<thinking>{"#text":"To analyze the distribution of payment methods (credit card types) used, we need to gather data from the relevant tables:\\n\\n### Approach:\\n1. Source Table:\\n - CreditCard:\\n - CardType: Different credit card types (e.g., Visa, MasterCard, etc.)\\n - CreditCardID: Unique identifier for each credit card.\\n\\n2. Steps:\\n - Query the CreditCard table to count the number of occurrences for each CardType, which reflects the distribution of payment methods.\\n - Visualize the distribution using a pie chart or bar graph.\\n\\nI'll proceed with retrieving the data for analysis."}</thinking>

Some text between blocks

<thinking>{"#text":"I have created a pie chart visualization for the distribution of payment methods (credit card types) used.\\n\\n### Key Insights:\\n- The chart displays the count of each credit card type used.\\n- The CardType labels are represented along with their proportions.\\n\\nYou can interpret from the pie slices how the credit card types are distributed. Let me know if you need further details or want the data displayed in another format!"}</thinking>
`;

console.log("Testing parser with #text structure...");

const parser = new StructuredContentParser();
const result = parser.parseStructuredContent(testContent);

console.log("Parsed blocks:");
result.forEach((block, index) => {
  console.log(`${index + 1}. Type: ${block.type}`);
  console.log(
    `   Content: ${block.content.substring(0, 100)}${
      block.content.length > 100 ? "..." : ""
    }`
  );
  console.log(`   Position: ${block.position}\n`);
});
