/**
 * MCP Protocol Compliance Tests
 * Tests for MCP protocol implementation and tool validation
 */

import { MCPTestClient, MockMCPServer } from '../helpers/mcp-test-client';
import { delay } from '../helpers/test-utils';

describe('MCP Protocol Compliance', () => {
  let client: MCPTestClient;
  let server: MockMCPServer;

  beforeEach(() => {
    client = new MCPTestClient();
    server = new MockMCPServer();

    // Connect client to server
    client.on('request', (request) => {
      const response = server.handleRequest(request);
      setTimeout(() => client.handleResponse(response), 10);
    });
  });

  afterEach(() => {
    client.cleanup();
  });

  describe('protocol initialization', () => {
    it('should handle initialize request correctly', async () => {
      const response = await client.initialize();

      expect(response.result).toBeDefined();
      expect(response.result.protocolVersion).toBe('2024-11-05');
      expect(response.result.capabilities).toBeDefined();
      expect(response.result.serverInfo).toBeDefined();
      expect(response.result.serverInfo.name).toBe('mock-web-crawler');
    });

    it('should return proper server info', async () => {
      const response = await client.initialize();
      const serverInfo = response.result.serverInfo;

      expect(serverInfo).toEqual({
        name: 'mock-web-crawler',
        version: '1.0.0'
      });
    });

    it('should declare required capabilities', async () => {
      const response = await client.initialize();
      const capabilities = response.result.capabilities;

      expect(capabilities).toBeDefined();
      expect(capabilities.tools).toBeDefined();
    });
  });

  describe('tools listing', () => {
    it('should list all 6 required web crawler tools', async () => {
      await client.initialize();
      const tools = await client.listTools();

      expect(tools).toHaveLength(6);

      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('crawl-url');
      expect(toolNames).toContain('crawl-docs');
      expect(toolNames).toContain('get-cached');
      expect(toolNames).toContain('search-cache');
      expect(toolNames).toContain('list-cache');
      expect(toolNames).toContain('clear-cache');
    });

    it('should provide proper tool schemas', async () => {
      await client.initialize();
      const tools = await client.listTools();

      const crawlUrlTool = tools.find(tool => tool.name === 'crawl-url');
      expect(crawlUrlTool).toBeDefined();
      expect(crawlUrlTool!.description).toBeTruthy();
      expect(crawlUrlTool!.inputSchema).toBeDefined();
      expect(crawlUrlTool!.inputSchema.type).toBe('object');
      expect(crawlUrlTool!.inputSchema.properties).toBeDefined();
      expect(crawlUrlTool!.inputSchema.required).toContain('url');
    });

    it('should validate input schemas for all tools', async () => {
      await client.initialize();
      const tools = await client.listTools();

      for (const tool of tools) {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();

        // Validate specific tool schemas
        switch (tool.name) {
          case 'crawl-url':
            expect(tool.inputSchema.required).toContain('url');
            expect(tool.inputSchema.properties.url).toBeDefined();
            expect(tool.inputSchema.properties.url.type).toBe('string');
            expect(tool.inputSchema.properties.url.format).toBe('uri');
            break;

          case 'crawl-docs':
            expect(tool.inputSchema.required).toContain('urls');
            expect(tool.inputSchema.properties.urls).toBeDefined();
            expect(tool.inputSchema.properties.urls.type).toBe('array');
            break;

          case 'get-cached':
            expect(tool.inputSchema.required).toContain('url');
            expect(tool.inputSchema.properties.url).toBeDefined();
            break;

          case 'search-cache':
            expect(tool.inputSchema.required).toContain('query');
            expect(tool.inputSchema.properties.query).toBeDefined();
            break;

          case 'clear-cache':
            expect(tool.inputSchema.required).toContain('confirm');
            expect(tool.inputSchema.properties.confirm).toBeDefined();
            expect(tool.inputSchema.properties.confirm.type).toBe('boolean');
            break;
        }
      }
    });
  });

  describe('tool execution', () => {
    beforeEach(async () => {
      await client.initialize();
    });

    describe('crawl-url tool', () => {
      it('should execute crawl-url successfully', async () => {
        const result = await client.testCrawlUrl('https://example.com');

        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
        expect(Array.isArray(result.content)).toBe(true);
        expect(result.content[0]).toBeDefined();
        expect(result.content[0].type).toBe('text');
        expect(result.content[0].text).toContain('Successfully crawled');
        expect(result.content[0].text).toContain('https://example.com');
      });

      it('should validate URL format', async () => {
        await expect(client.callTool('crawl-url', { url: 'invalid-url' }))
          .rejects.toThrow();
      });

      it('should handle missing URL parameter', async () => {
        await expect(client.callTool('crawl-url', {}))
          .rejects.toThrow();
      });
    });

    describe('crawl-docs tool', () => {
      it('should execute crawl-docs successfully', async () => {
        const urls = ['https://example1.com', 'https://example2.com'];
        const result = await client.testCrawlDocs(urls);

        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
        expect(result.content[0].text).toContain('Crawled 2 URLs');
      });

      it('should handle empty URLs array', async () => {
        await expect(client.callTool('crawl-docs', { urls: [] }))
          .rejects.toThrow();
      });

      it('should validate URLs array format', async () => {
        await expect(client.callTool('crawl-docs', { urls: 'not-an-array' }))
          .rejects.toThrow();
      });
    });

    describe('get-cached tool', () => {
      it('should execute get-cached successfully', async () => {
        const result = await client.testGetCached('https://example.com');

        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
        expect(result.content[0].text).toContain('Cached content');
      });

      it('should require URL parameter', async () => {
        await expect(client.callTool('get-cached', {}))
          .rejects.toThrow();
      });
    });

    describe('search-cache tool', () => {
      it('should execute search-cache successfully', async () => {
        const result = await client.testSearchCache('test query');

        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
        expect(result.content[0].text).toContain('Search results');
        expect(result.content[0].text).toContain('test query');
      });

      it('should require query parameter', async () => {
        await expect(client.callTool('search-cache', {}))
          .rejects.toThrow();
      });

      it('should handle empty query', async () => {
        await expect(client.callTool('search-cache', { query: '' }))
          .rejects.toThrow();
      });
    });

    describe('list-cache tool', () => {
      it('should execute list-cache successfully', async () => {
        const result = await client.testListCache();

        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
        expect(result.content[0].text).toContain('Cache listing');
      });

      it('should work with no parameters', async () => {
        const result = await client.callTool('list-cache', {});
        expect(result).toBeDefined();
      });
    });

    describe('clear-cache tool', () => {
      it('should execute clear-cache successfully', async () => {
        const result = await client.testClearCache();

        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
        expect(result.content[0].text).toContain('Cache cleared');
      });

      it('should require confirm parameter', async () => {
        await expect(client.callTool('clear-cache', {}))
          .rejects.toThrow();
      });

      it('should validate confirm parameter type', async () => {
        await expect(client.callTool('clear-cache', { confirm: 'yes' }))
          .rejects.toThrow();
      });

      it('should work with pattern parameter', async () => {
        const result = await client.callTool('clear-cache', {
          pattern: 'example.com',
          confirm: true
        });
        expect(result).toBeDefined();
      });
    });
  });

  describe('response format validation', () => {
    beforeEach(async () => {
      await client.initialize();
    });

    it('should return properly formatted MCP responses', async () => {
      const result = await client.testCrawlUrl();

      // Validate MCP response structure
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);

      for (const contentItem of result.content) {
        expect(contentItem.type).toBeDefined();
        expect(['text', 'image', 'resource'].includes(contentItem.type)).toBe(true);

        if (contentItem.type === 'text') {
          expect(contentItem.text).toBeDefined();
          expect(typeof contentItem.text).toBe('string');
        }
      }
    });

    it('should include proper metadata in responses', async () => {
      const result = await client.testCrawlUrl('https://example.com');

      expect(result.content[0].text).toContain('✅'); // Status indicator
      expect(result.content[0].text).toContain('https://example.com'); // URL
    });

    it('should handle unicode and special characters', async () => {
      const result = await client.testSearchCache('café 日本語 🚀');

      expect(result).toBeDefined();
      expect(result.content[0].text).toContain('café 日本語 🚀');
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await client.initialize();
    });

    it('should return proper error responses for invalid tool names', async () => {
      await expect(client.callTool('invalid-tool', {}))
        .rejects.toThrow('Unknown tool');
    });

    it('should validate parameter types', async () => {
      await expect(client.callTool('crawl-url', { url: 123 }))
        .rejects.toThrow();
    });

    it('should handle missing required parameters', async () => {
      await expect(client.callTool('crawl-url', { notUrl: 'value' }))
        .rejects.toThrow();
    });

    it('should return structured error responses', async () => {
      try {
        await client.callTool('invalid-tool', {});
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBeTruthy();
      }
    });
  });

  describe('protocol version compatibility', () => {
    it('should support MCP protocol version 2024-11-05', async () => {
      const response = await client.initialize();
      expect(response.result.protocolVersion).toBe('2024-11-05');
    });

    it('should handle unsupported protocol versions gracefully', async () => {
      // This test would check version negotiation in a real implementation
      const response = await client.sendRequest('initialize', {
        protocolVersion: '2023-01-01',
        capabilities: { tools: {} },
        clientInfo: { name: 'test', version: '1.0.0' }
      });

      // In a real implementation, this might return an error or downgrade
      expect(response).toBeDefined();
    });
  });

  describe('concurrent request handling', () => {
    beforeEach(async () => {
      await client.initialize();
    });

    it('should handle multiple concurrent tool calls', async () => {
      const promises = [
        client.testCrawlUrl('https://example1.com'),
        client.testCrawlUrl('https://example2.com'),
        client.testListCache(),
        client.testSearchCache('test')
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(4);
      for (const result of results) {
        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
      }
    });

    it('should maintain request-response correlation', async () => {
      // Send multiple requests and ensure responses match
      const requests = [
        { tool: 'crawl-url', args: { url: 'https://example1.com' } },
        { tool: 'crawl-url', args: { url: 'https://example2.com' } },
        { tool: 'search-cache', args: { query: 'test1' } },
        { tool: 'search-cache', args: { query: 'test2' } }
      ];

      const results = await Promise.all(
        requests.map(req => client.callTool(req.tool, req.args))
      );

      // Verify responses correspond to requests
      expect(results[0].content[0].text).toContain('example1.com');
      expect(results[1].content[0].text).toContain('example2.com');
      expect(results[2].content[0].text).toContain('test1');
      expect(results[3].content[0].text).toContain('test2');
    });
  });

  describe('timeout and reliability', () => {
    beforeEach(async () => {
      await client.initialize();
    });

    it('should timeout long-running requests', async () => {
      // Mock a request that takes too long
      const originalSendRequest = client.sendRequest;
      client.sendRequest = jest.fn().mockImplementation((method, params) => {
        if (method === 'tools/call' && params.name === 'crawl-url') {
          return new Promise((resolve) => {
            setTimeout(resolve, 15000); // 15 second delay
          });
        }
        return originalSendRequest.call(client, method, params);
      });

      await expect(client.testCrawlUrl())
        .rejects.toThrow(/timed out/);
    }, 20000);

    it('should handle malformed requests gracefully', async () => {
      const malformedRequest = {
        jsonrpc: '2.0',
        id: 'test',
        method: 'tools/call',
        params: {
          name: 'crawl-url',
          arguments: 'not-an-object' // Should be object
        }
      };

      const response = server.handleRequest(malformedRequest as any);
      expect(response.error).toBeDefined();
      expect(response.error!.code).toBe(-1);
    });
  });
});