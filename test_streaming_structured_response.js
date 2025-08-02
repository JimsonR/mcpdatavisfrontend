// Test file to verify streaming structured response parsing
// This demonstrates the new streaming structured agent format with tags

const testStreamingStructuredResponse = `
<thought>
I need to analyze the user's sales data to identify trends and patterns. Let me start by examining the data structure and then create appropriate visualizations.
</thought>

I'll help you analyze your sales data to identify key trends and insights. Let me start by loading and examining the data structure.

<tool_use>
<action>load_csv</action>
<action_input>
{
  "csv_path": "/path/to/sales_data.csv",
  "df_name": "sales_data"
}
</action_input>
<observation>
Successfully loaded CSV into dataframe 'sales_data' with 2,847 rows and 5 columns: ['Date', 'Product', 'Sales', 'Quantity', 'Region']
Date range: 2022-01-01 to 2023-12-31
</observation>
</tool_use>

Great! Now let me create a visualization to show the sales trends over time.

<tool_use>
<action>create_visualization</action>
<action_input>
{
  "df_name": "sales_data",
  "plot_type": "line",
  "x": "Date",
  "y": "Sales",
  "title": "Sales Trends Over Time"
}
</action_input>
<observation>
{
  "type": "line",
  "data": {
    "labels": ["2022-Q1", "2022-Q2", "2022-Q3", "2022-Q4", "2023-Q1", "2023-Q2", "2023-Q3", "2023-Q4"],
    "datasets": [{
      "label": "Sales",
      "data": [125000, 145000, 135000, 165000, 155000, 175000, 165000, 195000],
      "borderColor": "rgb(75, 192, 192)",
      "backgroundColor": "rgba(75, 192, 192, 0.2)",
      "tension": 0.1
    }]
  },
  "options": {
    "responsive": true,
    "plugins": {
      "title": {
        "display": true,
        "text": "Sales Trends Over Time"
      }
    },
    "scales": {
      "y": {
        "beginAtZero": true,
        "title": {
          "display": true,
          "text": "Sales ($)"
        }
      }
    }
  }
}
</observation>
</tool_use>

<final_answer>
Based on my analysis of your sales data, I've identified several key trends:

## 📈 **Key Findings**

### **Overall Growth**
- **56% growth** from Q1 2022 ($125K) to Q4 2023 ($195K)
- Consistent year-over-year improvement in performance
- Strong upward trajectory despite seasonal fluctuations

### **Seasonal Patterns**
- **Q4 Peak Performance**: Both 2022 and 2023 show highest sales in Q4
- **Q3 Dips**: Consistent drop in Q3 sales, likely summer slowdown
- **Recovery Pattern**: Strong Q4 recovery each year

### **Business Insights**
1. **Holiday Effect**: Q4 consistently outperforms other quarters
2. **Growth Momentum**: 2023 performance exceeded 2022 across all quarters
3. **Market Opportunity**: Q3 represents potential for improvement

The line chart clearly visualizes these trends, showing your business's strong growth trajectory with predictable seasonal patterns that can inform future planning and inventory management.
</final_answer>
`;

const testStreamingErrorResponse = `
<thought>
The user is asking for analysis of a dataset that I need to load first. Let me attempt to load the data.
</thought>

<action>load_csv</action>

<action_input>
{
  "csv_path": "/nonexistent/file.csv",
  "df_name": "test_data"
}
</action_input>

<observation>
Error: File not found at path '/nonexistent/file.csv'
</observation>

<error>
I apologize, but I encountered an error while trying to load the specified CSV file. The file path '/nonexistent/file.csv' does not exist or is not accessible.

To proceed with your data analysis, please:

1. **Verify the file path** - Ensure the CSV file exists at the specified location
2. **Check file permissions** - Make sure the file is readable
3. **Provide the correct path** - You can upload the file or provide the correct file path

Would you like to try again with a different file path, or would you prefer to upload your data directly?
</error>
`;

console.log(
  "Test streaming structured response:",
  testStreamingStructuredResponse
);
console.log("Test streaming error response:", testStreamingErrorResponse);

export { testStreamingErrorResponse, testStreamingStructuredResponse };
