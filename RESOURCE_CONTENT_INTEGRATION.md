# Resource Content Integration

## Overview

The MCP frontend now supports fetching and displaying actual resource content from MCP servers, not just metadata. This enhances the data science workflow by allowing users to directly access and include resource content in their chat conversations.

## Features

### 1. Resource Content Fetching
- **Endpoint**: `GET /mcp/get-resource-content`
- **Parameters**: 
  - `server`: The MCP server name
  - `uri`: The resource URI to fetch content for
- **Response**: Array of `ResourceContent` objects with `mimeType`, `type`, and `content` fields

### 2. Enhanced Resource UI
- **Loading States**: Resources show a loading spinner while content is being fetched
- **Error Handling**: Graceful fallback to basic resource metadata if content fetch fails
- **Content Display**: Properly formatted markdown with code blocks for resource content

### 3. Content Integration
- **Markdown Formatting**: Resource content is inserted with proper markdown formatting
- **Code Blocks**: Text content is wrapped in code blocks for better readability
- **Metadata Display**: Includes resource name, type, description, and URI
- **Seamless Integration**: Content is added to the chat input for immediate use

## Implementation Details

### Frontend Changes

#### API Service (`src/services/api.ts`)
```typescript
export interface ResourceContent {
  mimeType?: string
  type: 'text' | 'binary' | 'unknown'
  content?: string
}

export const getMCPResourceContent = (server: string, uri: string) =>
  api.get<ResourceContent[]>('/mcp/get-resource-content', { params: { server, uri } })
```

#### Chat Component (`src/pages/Chat.tsx`)
- Added `loadingResource` state to track which resource is being fetched
- Enhanced resource click handler to fetch actual content using `getMCPResourceContent`
- Added loading spinner overlay for resources being fetched
- Improved error handling with toast notifications
- Enhanced content formatting with markdown structure

### Backend Integration

The backend endpoint `/mcp/get-resource-content` should:
1. Accept `server` and `uri` parameters
2. Connect to the specified MCP server
3. Fetch the resource content using the MCP protocol
4. Return an array of `ResourceContent` objects
5. Handle errors gracefully and return appropriate HTTP status codes

## Usage

### For Users
1. **Browse Resources**: Click the sidebar toggle to view available resources from connected MCP servers
2. **Fetch Content**: Click on any resource to fetch its actual content
3. **View Loading**: Watch the loading spinner while content is being fetched
4. **Use Content**: The fetched content is automatically added to the chat input in markdown format
5. **Error Recovery**: If content can't be fetched, basic resource metadata is still provided

### For Developers
1. **Extend Content Types**: Add support for different MIME types and binary content
2. **Enhance Formatting**: Improve markdown formatting for specific content types
3. **Add Caching**: Implement client-side caching for frequently accessed resources
4. **Streaming Support**: Add support for streaming large resource content

## Error Handling

- **Network Errors**: Displays toast notification and falls back to metadata
- **Server Errors**: Graceful degradation with informative error messages
- **Timeout Handling**: Loading state prevents multiple simultaneous requests
- **Invalid Content**: Binary/unknown content is clearly marked

## Security Considerations

- **URI Validation**: Ensure resource URIs are properly validated on the backend
- **Content Sanitization**: Consider sanitizing text content before display
- **Access Control**: Respect MCP server access controls and permissions
- **Size Limits**: Implement reasonable size limits for resource content

## Performance Optimizations

- **Loading States**: Prevents multiple simultaneous requests for the same resource
- **Error Boundaries**: Isolated error handling doesn't break the entire UI
- **Efficient Rendering**: Conditional rendering based on loading states
- **Memory Management**: Large content is handled efficiently

## Future Enhancements

1. **Content Preview**: Show content preview in sidebar before adding to chat
2. **Content Editing**: Allow editing resource content before inserting
3. **Batch Operations**: Support selecting multiple resources at once
4. **Content History**: Keep track of recently accessed resources
5. **Advanced Filtering**: Filter resources by content type or size
6. **Syntax Highlighting**: Add syntax highlighting for code resources
7. **Binary Support**: Better handling of binary content (images, documents)
8. **Search Integration**: Search within resource content

## Testing

To test the resource content functionality:

1. **Start the Development Server**:
   ```bash
   npm run dev
   ```

2. **Open the Application**: Navigate to `http://localhost:3001`

3. **Connect MCP Servers**: Ensure you have MCP servers configured with resources

4. **Test Resource Fetching**:
   - Open the sidebar
   - Click on various resources
   - Verify loading states appear
   - Check that content is properly formatted
   - Test error scenarios (invalid URIs, server errors)

5. **Verify Integration**:
   - Ensure fetched content appears in chat input
   - Test markdown rendering of resource content
   - Verify error handling with toast notifications

## Dependencies

- **Frontend**: No additional dependencies required (uses existing axios and react-hot-toast)
- **Backend**: Requires FastAPI endpoint implementation for `/mcp/get-resource-content`
- **MCP Servers**: Servers must support resource content retrieval via MCP protocol
