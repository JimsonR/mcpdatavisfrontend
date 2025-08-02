// Test file for the real-world streaming structured response example
// Based on the actual response from the "top 10 customers" query

const testRealWorldStreamingResponse = `
<thought>
It seems that the table or object name Customer is not recognized in the current database context. Based on the schema, the correct name might need to include a schema prefix (e.g., Sales.Customer) or it might not exist as described. Let me investigate further and adjust the query accordingly.
</thought>

<tool_use>
<action>run_sql_query_enhanced</action>
<action_input>
{
  "args": {
    "sql": "SELECT TOP 10 c.CustomerID, c.AccountNumber, SUM(soh.TotalDue) AS TotalPurchaseAmount\nFROM Customer c\nJOIN SalesOrderHeader soh ON c.CustomerID = soh.CustomerID\nGROUP BY c.CustomerID, c.AccountNumber\nORDER BY TotalPurchaseAmount DESC;",
    "df_name": "top_customers",
    "purpose": "Find the top 10 customers by total purchase amount."
  }
}
</action_input>
<observation>
Error running SQL: Execution failed on sql 'SELECT TOP 10 c.CustomerID, c.AccountNumber, SUM(soh.TotalDue) AS TotalPurchaseAmount FROM Customer c JOIN SalesOrderHeader soh ON c.CustomerID = soh.CustomerID GROUP BY c.CustomerID, c.AccountNumber ORDER BY TotalPurchaseAmount DESC;': ('42S02', "[42S02] [Microsoft][ODBC Driver 17 for SQL Server][SQL Server]Invalid object name 'Customer'. (208) (SQLExecDirectW)")
</observation>
</tool_use>

<tool_use>
<action>run_sql_query_enhanced</action>
<action_input>
{
  "args": {
    "sql": "SELECT TOP 10 c.CustomerID, c.AccountNumber, SUM(soh.TotalDue) AS TotalPurchaseAmount\nFROM Sales.Customer c\nJOIN Sales.SalesOrderHeader soh ON c.CustomerID = soh.CustomerID\nGROUP BY c.CustomerID, c.AccountNumber\nORDER BY TotalPurchaseAmount DESC;",
    "df_name": "top_customers",
    "purpose": "Find the top 10 customers by total purchase amount."
  }
}
</action_input>
<observation>
Loaded SQL query into dataframe 'top_customers' (10 rows) Purpose: Find the top 10 customers by total purchase amount. Automatic insights: DataFrame with 10 rows and 3 columns. No obvious data quality issues detected.
</observation>
</tool_use>

<tool_use>
<action>list_dataframes</action>
<observation>
=== DATAFRAMES IN MEMORY ===

DataFrame: sales_by_year Shape: (4, 2) Columns: ['Year', 'TotalSales']

DataFrame: sales_by_territory Shape: (10, 2) Columns: ['TerritoryID', 'TotalSales']

DataFrame: total_sales_by_year Shape: (4, 2) Columns: ['SalesYear', 'TotalSales']

DataFrame: total_sales_by_territory Shape: (10, 2) Columns: ['TerritoryName', 'TotalSales']

DataFrame: top_customers Shape: (10, 3) Columns: ['CustomerID', 'AccountNumber', 'TotalPurchaseAmount']

DataFrame: product_sales_volume Shape: (10, 2) Columns: ['ProductID', 'TotalSalesVolume']

DataFrame: total_sales_by_year_and_territory Shape: (40, 3) Columns: ['SalesYear', 'TerritoryName', 'TotalSales']

DataFrame: top_customers_by_purchase Shape: (10, 2) Columns: ['CustomerID', 'TotalPurchaseAmount']

DataFrame: avg_order_value_per_customer Shape: (1, 1) Columns: ['AvgOrderValuePerCustomer']

DataFrame: territories_sales Shape: (10, 3) Columns: ['TerritoryName', 'SalesYTD', 'SalesLastYear']

Use these names in scripts: sales_by_year, sales_by_territory, total_sales_by_year, total_sales_by_territory, top_customers, product_sales_volume, total_sales_by_year_and_territory, top_customers_by_purchase, avg_order_value_per_customer, territories_sales
</observation>
</tool_use>

<tool_use>
<action>prepare_table_resource</action>
<action_input>
{
  "args": {
    "df_name": "top_customers",
    "n": 10,
    "title": "Top 10 Customers by Total Purchase Amount"
  }
}
</action_input>
<observation>
Table preview for 'top_customers' (10 rows, CSV format) prepared. Fetch via resource.
</observation>
</tool_use>

<final_answer>
The top 10 customers by total purchase amount have been identified, and a table containing their details is ready for review. You can access the data via the provided resource, which includes columns for CustomerID, AccountNumber, and TotalPurchaseAmount. Let me know if you need any further analysis or visualizations for this dataset.
</final_answer>
`;

const testSimpleToolUseResponse = `
<thought>
I need to load the database and check what tables are available.
</thought>

<tool_use>
<action>list_db_tables</action>
<observation>
=== DATABASE TABLES AND VIEWS (Sales schema only) ===

BASE TABLE: Customer
  Columns: CustomerID (int), PersonID (int), StoreID (int), TerritoryID (int), AccountNumber (varchar), rowguid (uniqueidentifier), ModifiedDate (datetime)

BASE TABLE: SalesOrderHeader  
  Columns: SalesOrderID (int), RevisionNumber (tinyint), OrderDate (datetime), DueDate (datetime), ShipDate (datetime), Status (tinyint), OnlineOrderFlag (bit), SalesOrderNumber (nvarchar), PurchaseOrderNumber (nvarchar), AccountNumber (nvarchar), CustomerID (int), SalesPersonID (int), TerritoryID (int), BillToAddressID (int), ShipToAddressID (int), ShipMethodID (int), CreditCardID (int), CreditCardApprovalCode (varchar), CurrencyRateID (int), SubTotal (money), TaxAmt (money), Freight (money), TotalDue (money), Comment (nvarchar), rowguid (uniqueidentifier), ModifiedDate (datetime)
</observation>
</tool_use>

<final_answer>
The database has been loaded successfully. I can see the Sales schema contains tables like Customer and SalesOrderHeader among others. What would you like to analyze next?
</final_answer>
`;

console.log(
  "Real-world streaming response test:",
  testRealWorldStreamingResponse
);
console.log("Simple tool use test:", testSimpleToolUseResponse);

export { testRealWorldStreamingResponse, testSimpleToolUseResponse };
