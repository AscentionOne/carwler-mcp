# MCP TypeScript SDK Reference

## Recommended SDK Choice for Node.js/TypeScript Projects

**TypeScript SDK**: `/modelcontextprotocol/typescript-sdk`
- **Best Choice**: Native TypeScript support with full type safety
- **Code Snippets**: 40 available examples
- **Trust Score**: 7.8/10
- **Perfect for**: Node.js servers with TypeScript

## Core Server Implementation Patterns

### 1. Simple MCP Server (StdioServerTransport)
```typescript
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create an MCP server
const server = new McpServer({
  name: "demo-server",
  version: "1.0.0"
});

// Add a tool
server.registerTool("add",
  {
    title: "Addition Tool",
    description: "Add two numbers",
    inputSchema: { a: z.number(), b: z.number() }
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);

// Add a resource
server.registerResource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  {
    title: "Greeting Resource",
    description: "Dynamic greeting generator"
  },
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `Hello, ${name}!`
    }]
  })
);

// Connect via stdin/stdout
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 2. MCP Server Architecture Components

**McpServer**: High-level server class
- `registerTool()`: Register CLI tools
- `registerResource()`: Register data resources
- `registerPrompt()`: Register prompt templates
- Auto-handles protocol compliance and message routing

**Transport Options**:
- `StdioServerTransport`: stdin/stdout for CLI integration
- `StreamableHTTPServerTransport`: HTTP server for web integration
- `SSEServerTransport`: Legacy SSE support

### 3. Tool Registration Pattern
```typescript
server.registerTool(
  "tool-name",
  {
    title: "Display Name",
    description: "What this tool does",
    inputSchema: { param1: z.string(), param2: z.number() }
  },
  async (params) => ({
    content: [{ type: "text", text: "Response text" }]
  })
);
```

### 4. Resource Registration Pattern
```typescript
server.registerResource(
  "resource-type",
  new ResourceTemplate("scheme://{param}", { list: undefined }),
  {
    title: "Resource Display Name",
    description: "What this resource provides"
  },
  async (uri, params) => ({
    contents: [{
      uri: uri.href,
      text: "Resource content"
    }]
  })
);
```

## Key MCP Concepts for Web Crawler Integration

### Tools vs Resources
- **Tools**: Active operations (crawl-url, crawl-docs, clear-cache)
- **Resources**: Data retrieval (get-cached, search-cache, list-cache)

### Protocol Patterns
- Request-response based (not streaming)
- JSON-RPC 2.0 messaging
- Automatic capability negotiation
- Built-in error handling

### Claude Code Integration
- Register as subagent type "web-crawler"
- Token-efficient responses (<2000 tokens)
- Smart caching for performance
- Cross-platform storage support

## Next Implementation Steps

1. Convert CLI to MCP server using `McpServer` + `StdioServerTransport`
2. Register MCP tools: `crawl-url`, `crawl-docs`, cache management
3. Register MCP resources: cached content access
4. Implement caching system with token management
5. Test with Claude Code integration