// Test file to verify structured response parsing
// This can be used to debug and test the StructuredResponseRenderer

const testStructuredResponse = `
<thinking>
I need to analyze the user's request and determine what kind of chart would be best for their data. They've provided sales data over time, so a line chart would be most appropriate. Let me first load the data and then create the visualization.
</thinking>

I'll help you create a visualization of your sales data. Let me start by loading the data and then generate the appropriate chart.

<tool_call>
<tool_name>load_csv</tool_name>
<args>{"csv_path": "/path/to/sales_data.csv", "df_name": "sales_df"}</args>
<tool_result>Successfully loaded CSV into dataframe 'sales_df' with 1000 rows and 5 columns: ['Date', 'Product', 'Sales', 'Quantity', 'Region']</tool_result>
</tool_call>

Great! The data has been loaded successfully. Now let me create a line chart to show the sales trends over time.

<tool_call>
<tool_name>create_visualization</tool_name>
<args>{"df_name": "sales_df", "plot_type": "line", "x": "Date", "y": "Sales", "title": "Sales Trends Over Time"}</args>
<tool_result>{"type": "line", "data": {"labels": ["2023-01", "2023-02", "2023-03", "2023-04", "2023-05", "2023-06"], "datasets": [{"label": "Sales", "data": [15000, 18000, 22000, 25000, 23000, 28000], "borderColor": "rgb(75, 192, 192)", "backgroundColor": "rgba(75, 192, 192, 0.2)", "tension": 0.1}]}, "options": {"responsive": true, "plugins": {"title": {"display": true, "text": "Sales Trends Over Time"}}, "scales": {"y": {"beginAtZero": true, "title": {"display": true, "text": "Sales ($)"}}}}}</tool_result>
</tool_call>

<result>
Perfect! I've created a line chart showing your sales trends over time. The visualization shows:

- **Steady Growth**: Sales increased from $15,000 in January to $28,000 in June
- **Peak Performance**: The highest sales were recorded in June ($28,000)
- **Minor Dip**: There was a slight decrease in May ($23,000) before the final surge
- **Overall Trend**: 87% growth over the 6-month period

The chart clearly shows a positive upward trend in your sales data, indicating strong business performance.
</result>

Would you like me to create additional visualizations or analyze specific aspects of your sales data further?

\`\`\`json
{
  "type": "bar",
  "data": {
    "labels": ["Q1", "Q2", "Q3", "Q4"],
    "datasets": [{
      "label": "Quarterly Revenue",
      "data": [75000, 85000, 78000, 92000],
      "backgroundColor": ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"]
    }]
  },
  "options": {
    "responsive": true,
    "plugins": {
      "title": {
        "display": true,
        "text": "Quarterly Revenue Comparison"
      }
    }
  }
}
\`\`\`
`;

const testComplexStructuredResponse = `
<thinking>
The user wants to analyze seasonal trends in their sales data. I need to:
1. First examine the data structure
2. Group the data by time periods (months/quarters)
3. Calculate aggregated metrics
4. Create appropriate visualizations
5. Provide insights on seasonal patterns
</thinking>

I'll analyze your sales data to identify seasonal trends. Let me start by examining the data structure and then create several visualizations to highlight different seasonal patterns.

<tool_call>
<tool_name>run_script</tool_name>
<args>{"script": "# Examine data structure and basic statistics\\nimport pandas as pd\\nimport numpy as np\\n\\n# Display basic info about the dataset\\nprint(f'Dataset shape: {sales_df.shape}')\\nprint(f'Columns: {list(sales_df.columns)}')\\nprint(f'Date range: {sales_df[\"Date\"].min()} to {sales_df[\"Date\"].max()}')\\n\\n# Convert Date column to datetime if needed\\nsales_df['Date'] = pd.to_datetime(sales_df['Date'])\\n\\n# Extract temporal features\\nsales_df['Month'] = sales_df['Date'].dt.month\\nsales_df['Quarter'] = sales_df['Date'].dt.quarter\\nsales_df['Year'] = sales_df['Date'].dt.year\\n\\nprint('\\nData preview:')\\nprint(sales_df.head())", "save_to_memory": ["sales_df"]}</args>
<tool_result>Dataset shape: (2847, 8)
Columns: ['Date', 'Product', 'Sales', 'Quantity', 'Region', 'Month', 'Quarter', 'Year']
Date range: 2022-01-01 to 2023-12-31
Data preview:
        Date     Product   Sales  Quantity Region  Month  Quarter  Year
0 2022-01-15  Product A  12500        25   North      1        1  2022
1 2022-01-22  Product B   8900        18   South      1        1  2022
2 2022-02-03  Product A  15600        31   East       2        1  2022
3 2022-02-14  Product C  11200        22   West       2        1  2022
4 2022-03-01  Product B  13400        26   North      3        1  2022</tool_result>
</tool_call>

Now let me create monthly aggregations and generate a seasonal trends visualization:

<tool_call>
<tool_name>create_visualization</tool_name>
<args>{"df_name": "sales_df", "plot_type": "area", "x": "Month", "y": "Sales", "title": "Monthly Sales Trends - Seasonal Analysis", "aggregate": "sum"}</args>
<tool_result>{"type": "area", "series": {"Sales": [{"x": "January", "y": 125000}, {"x": "February", "y": 98000}, {"x": "March", "y": 145000}, {"x": "April", "y": 167000}, {"x": "May", "y": 189000}, {"x": "June", "y": 201000}, {"x": "July", "y": 198000}, {"x": "August", "y": 185000}, {"x": "September", "y": 172000}, {"x": "October", "y": 156000}, {"x": "November", "y": 198000}, {"x": "December", "y": 234000}]}, "title": "Monthly Sales Trends - Seasonal Analysis", "x": "Month", "y": "Sales", "sampled": false}</tool_result>
</tool_call>

<result>
Based on the seasonal analysis of your sales data, I've identified several key patterns:

## 🔍 **Seasonal Trends Discovered**

### **Peak Seasons**
- **Holiday Season (Dec)**: Highest sales at $234K - 87% above average
- **Summer Period (May-July)**: Strong performance with $189K-$201K monthly
- **Spring Growth (Mar-Apr)**: Consistent upward trend from $145K to $167K

### **Low Seasons**
- **Post-Holiday (Feb)**: Lowest performance at $98K - typical post-holiday dip
- **Fall Transition (Sep-Oct)**: Gradual decline from $172K to $156K

### **Key Insights**
1. **Strong Holiday Effect**: December shows exceptional performance
2. **Summer Consistency**: June-August maintains high, stable sales
3. **Quarterly Pattern**: Q4 > Q2 > Q3 > Q1 in terms of average performance
4. **Recovery Pattern**: November shows strong recovery leading to December peak

The area chart visualization clearly shows these seasonal fluctuations, with the distinctive December spike and February valley creating a pronounced seasonal cycle.
</result>

Would you like me to dive deeper into any specific seasonal pattern or create additional visualizations for quarterly comparisons?
`;

const testToolExecutionCharts = [
  {
    tool_name: "create_visualization",
    arguments: {
      df_name: "df_7",
      plot_type: "bar",
      x: "ProductName",
      y: "Quantity",
      title: "Top 5 Popular Products",
    },
    tool_response: JSON.stringify({
      type: "bar",
      bars: [
        { label: "Popcorn Holder", value: 56450.0 },
        { label: "World War 2 Gliders Asstd Designs", value: 53847.0 },
        { label: "Jumbo Bag Red Retrospot", value: 47363.0 },
        { label: "Assorted Colour Bird Ornament", value: 36445.0 },
        { label: "Pack Of 72 Retrospot Cake Cases", value: 36231.0 },
      ],
      title: "Top 5 Popular Products",
      x: "ProductName",
      y: "Quantity",
    }),
  },
  {
    tool_name: "create_visualization",
    arguments: {
      df_name: "df_7",
      plot_type: "line",
      x: "Date",
      y: "TotalSales",
      title: "Transaction Trend Over Time",
    },
    tool_response: JSON.stringify({
      type: "line",
      points: [
        { x: "12/9/2019", y: 257.64 },
        { x: "12/8/2019", y: 12.38 },
        { x: "12/6/2019", y: 74.28 },
        { x: "12/5/2019", y: 79.64 },
        { x: "12/2/2019", y: 37.14 },
      ],
      title: "Transaction Trend Over Time",
      x: "Date",
      y: "TotalSales",
    }),
  },
];

console.log("Test structured response:", testStructuredResponse);
console.log("Test complex structured response:", testComplexStructuredResponse);
console.log("Test tool execution charts:", testToolExecutionCharts);

export {
  testComplexStructuredResponse,
  testStructuredResponse,
  testToolExecutionCharts,
};
