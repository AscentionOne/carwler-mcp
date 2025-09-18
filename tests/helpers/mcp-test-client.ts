/**
 * MCP Test Client
 * Test client for MCP protocol compliance testing
 */

import { EventEmitter } from 'events';

export interface MCPRequest {
  jsonrpc: string;
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: string;
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export class MCPTestClient extends EventEmitter {
  private messageId = 0;
  private pendingRequests = new Map<string | number, {
    resolve: (value: MCPResponse) => void;
    reject: (error: Error) => void;
  }>();

  /**
   * Send MCP request and wait for response
   */
  async sendRequest(method: string, params?: any): Promise<MCPResponse> {
    const id = ++this.messageId;
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      // Simulate sending request to MCP server
      this.emit('request', request);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request ${id} timed out`));
        }
      }, 10000);
    });
  }

  /**
   * Handle response from MCP server
   */
  handleResponse(response: MCPResponse): void {
    const pending = this.pendingRequests.get(response.id);
    if (pending) {
      this.pendingRequests.delete(response.id);
      if (response.error) {
        pending.reject(new Error(response.error.message));
      } else {
        pending.resolve(response);
      }
    }
  }

  /**
   * Initialize MCP connection
   */
  async initialize(): Promise<MCPResponse> {
    return this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    });
  }

  /**
   * List available tools
   */
  async listTools(): Promise<MCPTool[]> {
    const response = await this.sendRequest('tools/list');
    return response.result?.tools || [];
  }

  /**
   * Call a tool
   */
  async callTool(name: string, arguments_: any): Promise<any> {
    const response = await this.sendRequest('tools/call', {
      name,
      arguments: arguments_
    });
    return response.result;
  }

  /**
   * Test all web crawler tools
   */
  async testCrawlerTools(): Promise<{
    'crawl-url': boolean;
    'crawl-docs': boolean;
    'get-cached': boolean;
    'search-cache': boolean;
    'list-cache': boolean;
    'clear-cache': boolean;
  }> {
    const tools = await this.listTools();
    const expectedTools = [
      'crawl-url',
      'crawl-docs',
      'get-cached',
      'search-cache',
      'list-cache',
      'clear-cache'
    ];

    const results: any = {};
    for (const toolName of expectedTools) {
      results[toolName] = tools.some(tool => tool.name === toolName);
    }

    return results;
  }

  /**
   * Test crawl-url tool
   */
  async testCrawlUrl(url: string = 'https://example.com'): Promise<any> {
    return this.callTool('crawl-url', { url });
  }

  /**
   * Test crawl-docs tool
   */
  async testCrawlDocs(urls: string[] = ['https://example.com']): Promise<any> {
    return this.callTool('crawl-docs', { urls });
  }

  /**
   * Test get-cached tool
   */
  async testGetCached(url: string): Promise<any> {
    return this.callTool('get-cached', { url });
  }

  /**
   * Test search-cache tool
   */
  async testSearchCache(query: string): Promise<any> {
    return this.callTool('search-cache', { query });
  }

  /**
   * Test list-cache tool
   */
  async testListCache(): Promise<any> {
    return this.callTool('list-cache', {});
  }

  /**
   * Test clear-cache tool
   */
  async testClearCache(pattern?: string): Promise<any> {
    return this.callTool('clear-cache', {
      pattern,
      confirm: true
    });
  }

  /**
   * Cleanup client
   */
  cleanup(): void {
    this.removeAllListeners();
    this.pendingRequests.clear();
  }
}

/**
 * Mock MCP server for testing
 */
export class MockMCPServer extends EventEmitter {
  private tools: MCPTool[] = [
    {
      name: 'crawl-url',
      description: 'Scrape a single URL',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', format: 'uri' }
        },
        required: ['url']
      }
    },
    {
      name: 'crawl-docs',
      description: 'Batch crawl multiple URLs',
      inputSchema: {
        type: 'object',
        properties: {
          urls: { type: 'array', items: { type: 'string' } }
        },
        required: ['urls']
      }
    },
    {
      name: 'get-cached',
      description: 'Retrieve cached content',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', format: 'uri' }
        },
        required: ['url']
      }
    },
    {
      name: 'search-cache',
      description: 'Search cached content',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' }
        },
        required: ['query']
      }
    },
    {
      name: 'list-cache',
      description: 'List cached documents',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'clear-cache',
      description: 'Clear cache',
      inputSchema: {
        type: 'object',
        properties: {
          pattern: { type: 'string' },
          confirm: { type: 'boolean' }
        },
        required: ['confirm']
      }
    }
  ];

  handleRequest(request: MCPRequest): MCPResponse {
    try {
      let result;

      switch (request.method) {
        case 'initialize':
          result = {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'mock-web-crawler',
              version: '1.0.0'
            }
          };
          break;

        case 'tools/list':
          result = { tools: this.tools };
          break;

        case 'tools/call':
          result = this.handleToolCall(request.params);
          break;

        default:
          throw new Error(`Unknown method: ${request.method}`);
      }

      return {
        jsonrpc: '2.0',
        id: request.id,
        result
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -1,
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  private handleToolCall(params: any): any {
    const { name, arguments: args } = params;

    switch (name) {
      case 'crawl-url':
        return {
          content: [{
            type: 'text',
            text: `✅ Successfully crawled: ${args.url}\n# Mock Page\nMock content`
          }]
        };

      case 'crawl-docs':
        return {
          content: [{
            type: 'text',
            text: `✅ Crawled ${args.urls.length} URLs successfully`
          }]
        };

      case 'get-cached':
        return {
          content: [{
            type: 'text',
            text: `📄 Cached content for ${args.url}`
          }]
        };

      case 'search-cache':
        return {
          content: [{
            type: 'text',
            text: `🔍 Search results for "${args.query}"`
          }]
        };

      case 'list-cache':
        return {
          content: [{
            type: 'text',
            text: '📋 Cache listing'
          }]
        };

      case 'clear-cache':
        return {
          content: [{
            type: 'text',
            text: '🗑️ Cache cleared'
          }]
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}