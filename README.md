# MCP Frontend

A modern React frontend for interacting with Model Context Protocol (MCP) servers and LLM agents.

## Features

- **Dashboard**: Overview of system status, server count, and available tools
- **Chat Interface**: Communicate with LLM directly or through MCP agent mode
- **Server Management**: Add, edit, and delete MCP servers
- **Tools Explorer**: Browse and execute tools from connected MCP servers
- **Responsive Design**: Modern UI that works on desktop and mobile

## Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Your MCP backend server running (see the Python FastAPI backend)

### Installation

1. Install dependencies:
```powershell
npm install
```

2. Start the development server:
```powershell
npm run dev
```

The frontend will be available at `http://localhost:3000` and will proxy API requests to your backend at `http://127.0.0.1:8080`.

### Backend Integration

This frontend is designed to work with the FastAPI backend you provided. Make sure your backend is running on `http://127.0.0.1:8080` before starting the frontend.

The frontend communicates with these backend endpoints:
- `/api/health` - Health check
- `/mcp/*` - MCP server management and tool operations
- `/llm/*` - Direct LLM chat and agent interactions
- `/langchain/*` - LangChain tool listings

## Usage

### Managing MCP Servers

1. Go to the "Servers" page
2. Click "Add Server" to add a new MCP server
3. Provide the server name, URL, and transport type
4. Edit or delete servers as needed

### Chatting with the AI

1. Go to the "Chat" page
2. Choose between "Direct LLM" or "Agent Mode"
   - Direct LLM: Chat directly with the language model
   - Agent Mode: Use the LLM with access to MCP tools
3. Type your message and press Enter or click Send

### Using Tools

1. Go to the "Tools" page
2. Select a server from the dropdown
3. Browse available tools with their descriptions and schemas
4. Click "Execute" on any tool to run it
5. Provide arguments in JSON format when prompted
6. View execution results in the history section

## Architecture

```
Frontend (React + TypeScript)
    ↓ HTTP Requests
Backend (FastAPI)
    ↓ MCP Protocol
MCP Servers (Various)
```

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **React Hook Form** - Form handling
- **Axios** - HTTP client
- **Lucide React** - Icons
- **React Hot Toast** - Notifications
- **Vite** - Build tool

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run linter

### Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Layout.tsx      # Main layout with navigation
├── pages/              # Page components
│   ├── Dashboard.tsx   # Dashboard overview
│   ├── Chat.tsx        # Chat interface
│   ├── ServerManagement.tsx # MCP server management
│   └── Tools.tsx       # Tools browser and executor
├── services/           # API integration
│   └── api.ts          # Backend API client
├── lib/                # Utilities
│   └── utils.ts        # Helper functions
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── index.css           # Global styles
```

## Configuration

The frontend is configured to proxy requests to the backend at `http://127.0.0.1:8080`. If your backend runs on a different address, update the proxy configuration in `vite.config.ts`.

## Production Deployment

1. Build the application:
```powershell
npm run build
```

2. Serve the `dist` folder using a web server like nginx or serve it from your backend.

3. Update CORS settings in your backend to allow requests from your production domain.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
