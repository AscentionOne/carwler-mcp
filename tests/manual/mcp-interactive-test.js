#!/usr/bin/env node

/**
 * Manual MCP Server Interactive Test
 * Use this for debugging MCP protocol issues during development
 *
 * Usage: node tests/manual/mcp-interactive-test.js
 */

const { spawn } = require('child_process');
const { randomUUID } = require('crypto');
const readline = require('readline');

class MCPInteractiveTester {
  constructor() {
    this.server = null;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async startServer() {
    console.log('🚀 Starting MCP server...');
    this.server = spawn('npm', ['run', 'mcp'], { stdio: ['pipe', 'pipe', 'inherit'] });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('✅ MCP server started');
    return this.server;
  }

  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for response'));
      }, 10000);

      let response = '';
      const onData = (data) => {
        response += data.toString();
        try {
          const parsed = JSON.parse(response);
          if (parsed.id === message.id) {
            clearTimeout(timeout);
            this.server.stdout.off('data', onData);
            resolve(parsed);
          }
        } catch (e) {
          // Continue collecting data
        }
      };

      this.server.stdout.on('data', onData);
      this.server.stdin.write(JSON.stringify(message) + '\\n');
    });
  }

  async initialize() {
    const response = await this.sendMessage({
      jsonrpc: '2.0',
      id: randomUUID(),
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'manual-tester', version: '1.0.0' }
      }
    });

    console.log('📡 Server initialized:', response.result.serverInfo);
    return response;
  }

  async listTools() {
    const response = await this.sendMessage({
      jsonrpc: '2.0',
      id: randomUUID(),
      method: 'tools/list'
    });

    console.log('🔧 Available tools:');
    response.result.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    return response.result.tools;
  }

  async testCrawlUrl(url = 'https://example.com') {
    console.log(`🕷️  Testing crawl-url with: ${url}`);

    const response = await this.sendMessage({
      jsonrpc: '2.0',
      id: randomUUID(),
      method: 'tools/call',
      params: {
        name: 'crawl-url',
        arguments: { url }
      }
    });

    console.log('📄 Crawl result:');
    console.log(response.result.content[0].text.substring(0, 200) + '...');
    return response;
  }

  async interactive() {
    console.log('\\n🎮 Interactive mode - Enter commands:');
    console.log('Commands: crawl <url>, list, cache, search <query>, quit');

    const askQuestion = () => {
      this.rl.question('> ', async (input) => {
        const [command, ...args] = input.trim().split(' ');

        try {
          switch (command) {
            case 'crawl':
              await this.testCrawlUrl(args[0] || 'https://example.com');
              break;

            case 'list':
              await this.sendMessage({
                jsonrpc: '2.0',
                id: randomUUID(),
                method: 'tools/call',
                params: { name: 'list-cache', arguments: {} }
              }).then(r => console.log(r.result.content[0].text));
              break;

            case 'search':
              await this.sendMessage({
                jsonrpc: '2.0',
                id: randomUUID(),
                method: 'tools/call',
                params: { name: 'search-cache', arguments: { query: args.join(' ') } }
              }).then(r => console.log(r.result.content[0].text));
              break;

            case 'quit':
              console.log('👋 Goodbye!');
              this.cleanup();
              return;

            default:
              console.log('Unknown command. Try: crawl, list, search, quit');
          }
        } catch (error) {
          console.error('❌ Error:', error.message);
        }

        askQuestion();
      });
    };

    askQuestion();
  }

  cleanup() {
    if (this.server) {
      this.server.kill();
    }
    this.rl.close();
    process.exit(0);
  }
}

// Run the interactive tester
async function main() {
  const tester = new MCPInteractiveTester();

  try {
    await tester.startServer();
    await tester.initialize();
    await tester.listTools();

    // Quick test
    await tester.testCrawlUrl();

    // Interactive mode
    await tester.interactive();

  } catch (error) {
    console.error('❌ Test failed:', error);
    tester.cleanup();
  }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\\n🛑 Interrupted');
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = MCPInteractiveTester;