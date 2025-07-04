// Test Tool Execution Response
// This simulates the backend response structure you provided

const testToolExecutionResponse = {
    "response": "The CSV file has been successfully loaded into a DataFrame named \"insights\". If you'd like, I can explore the data further to generate insights. Let me know how you'd like to proceed!",
    "tool_executions": [
        {
            "tool_name": "load_csv",
            "arguments": {
                "args": {
                    "csv_path": "C:/Users/jimmy/Downloads/archive(1)/sales_data_sample.csv",
                    "df_name": "insights"
                }
            },
            "id": "call_y6eSSYSc5ve6JajwpJWuYx4J"
        },
        {
            "tool_response": "Successfully loaded CSV into dataframe 'insights'",
            "tool_call_id": "call_y6eSSYSc5ve6JajwpJWuYx4J"
        },
        {
            "tool_name": "get_notes",
            "arguments": {},
            "id": "call_VuqPj810QbkfrM9VCEN5o9Pw"
        },
        {
            "tool_response": "Successfully loaded CSV into dataframe 'df_1'\nRunning script: \nPerform data exploration for insights.\nRunning script: \nPerform data exploration for insights.\nSuccessfully loaded CSV into dataframe 'insights'",
            "tool_call_id": "call_VuqPj810QbkfrM9VCEN5o9Pw"
        }
    ],
    "full_conversation": [
        // ... conversation data
    ]
}

// Test the tool name extraction logic with merging
function testToolNameExtraction() {
    console.log('Testing tool name extraction with merging...')
    
    // Simulate the new merging logic
    const rawToolExecutions = testToolExecutionResponse.tool_executions
    
    // Separate tool calls and tool responses
    const toolCalls = rawToolExecutions.filter(exec => exec.tool_name)
    const toolResponses = rawToolExecutions.filter(exec => exec.tool_response)
    
    console.log('Tool calls:', toolCalls)
    console.log('Tool responses:', toolResponses)
    
    // Merge tool calls with their responses
    const mergedExecutions = toolCalls.map(call => {
        const matchingResponse = toolResponses.find(resp => 
            resp.tool_call_id === call.id
        )
        
        return {
            ...call,
            tool_response: matchingResponse?.tool_response
        }
    })
    
    console.log('\nMerged executions:')
    mergedExecutions.forEach((execution, idx) => {
        const toolName = execution.tool_name || 'Unknown Tool'
        const toolArgs = execution.arguments?.args || execution.arguments || {}
        
        console.log(`Tool ${idx + 1}:`)
        console.log(`  Name: ${toolName}`)
        console.log(`  Args:`, toolArgs)
        console.log(`  Response: ${execution.tool_response ? 'YES' : 'NO'}`)
        console.log('---')
    })
}

// Run the test
testToolNameExtraction()

export { testToolExecutionResponse, testToolNameExtraction }

