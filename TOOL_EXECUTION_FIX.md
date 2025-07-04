# Tool Execution Display Fix

## Problem

Users were seeing "Unknown Tool" in the UI instead of actual tool names like `load_csv` and `get_notes`, even though the backend response contained the correct tool names.

## Root Cause

The backend sends tool executions as **separate entries** for tool calls and tool responses:

```json
{
  "tool_executions": [
    {
      "tool_name": "load_csv",
      "arguments": {"args": {"csv_path": "...", "df_name": "insights"}},
      "id": "call_y6eSSYSc5ve6JajwpJWuYx4J"
    },
    {
      "tool_response": "Successfully loaded CSV into dataframe 'insights'",
      "tool_call_id": "call_y6eSSYSc5ve6JajwpJWuYx4J"
    }
  ]
}
```

The frontend was treating each entry as a separate tool execution, but tool responses don't have `tool_name`, causing "Unknown Tool" to appear.

## Solution

**Merge tool calls with their responses** by matching `id` with `tool_call_id`:

### Implementation

```typescript
// Process tool executions - merge calls with responses
const rawToolExecutions = response.tool_executions || []

// Separate tool calls and tool responses
const toolCalls = rawToolExecutions.filter(exec => exec.tool_name)
const toolResponses = rawToolExecutions.filter(exec => exec.tool_response)

// Merge tool calls with their responses
toolExecutions = toolCalls.map(call => {
  const matchingResponse = toolResponses.find(resp => 
    resp.tool_call_id === call.id
  )
  
  return {
    ...call,
    tool_response: matchingResponse?.tool_response
  }
})
```

### Result

Now each tool execution has:
- ✅ Correct tool name (`load_csv`, `get_notes`)
- ✅ Tool arguments properly extracted
- ✅ Tool response attached
- ✅ No more "Unknown Tool" entries

## Files Modified

### `src/pages/Chat.tsx`
- Added tool execution merging logic in the `useDetailedAgent` flow
- Fixed argument extraction to handle nested `args` structure
- Cleaned up debug logging

### Benefits
1. **Accurate Tool Names**: Shows actual tool names instead of "Unknown Tool"
2. **Complete Information**: Each tool execution shows both call and response
3. **Better UX**: Users can see exactly which tools were executed
4. **Debugging**: Easier to understand what happened during agent execution

## Testing

Created `test_tool_execution.js` to verify the merging logic works correctly:

```bash
node test_tool_execution.js
```

Output shows proper merging:
```
Tool 1:
  Name: load_csv
  Args: { csv_path: "...", df_name: "insights" }
  Response: YES

Tool 2:
  Name: get_notes
  Args: {}
  Response: YES
```

## Future Considerations

- **Error Handling**: Handle cases where tool responses don't match tool calls
- **Performance**: Consider caching tool execution mappings for large responses
- **Validation**: Add validation to ensure tool execution structure is correct
- **Typing**: Enhance TypeScript interfaces for better type safety

The fix ensures that tool executions are displayed correctly with proper names and complete information, providing a much better user experience for debugging and understanding agent behavior.
