#!/usr/bin/env node

/**
 * MCP Server Entry Point for Web Crawler
 *
 * Converts the CLI web crawler into a Model Context Protocol server
 * for integration with Claude Code and other MCP clients.
 *
 * Architecture:
 * - McpServer: Protocol-compliant server with tool/resource registration
 * - StdioServerTransport: stdin/stdout communication for CLI integration
 * - SimpleCrawler: Existing batch processing with v0.7.x features
 * - Cross-platform caching: ~/.claude/crawled_docs/ storage
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { SimpleCrawler } from './crawler.js';
import { getPreset, type PresetName } from './config.js';
import { WebCrawlerCache } from './cache.js';
import type { CrawlerOptions, BatchCrawlOptions } from './types/index.js';

/**
 * MCP Web Crawler Server
 *
 * Provides Claude Code with web scraping capabilities via MCP protocol.
 * Implements caching, batch processing, and token-efficient responses.
 */
class McpWebCrawlerServer {
  private server: McpServer;
  private crawler: SimpleCrawler;
  private cache: WebCrawlerCache;

  constructor() {
    // Initialize MCP server
    this.server = new McpServer({
      name: "web-crawler-mcp",
      version: "1.0.0"
    });

    // Initialize crawler with production settings
    const crawlerOptions: CrawlerOptions = {
      timeout: 60000,
      verbose: false, // Reduce noise in MCP context
      pythonPath: 'python3.11'
    };
    this.crawler = new SimpleCrawler(crawlerOptions);

    // Initialize caching system
    this.cache = new WebCrawlerCache();

    this.registerTools();
    this.registerResources();
  }


  /**
   * Register MCP tools (active operations)
   */
  private registerTools(): void {
    // Tool: crawl-url (single URL scraping)
    this.server.registerTool(
      "crawl-url",
      {
        title: "Crawl Single URL",
        description: "Scrape a single URL and return markdown content",
        inputSchema: {
          url: z.string().url().describe("URL to scrape (must be http:// or https://)"),
          css_selector: z.string().optional().describe("CSS selector to focus content extraction"),
          timeout: z.number().optional().describe("Timeout in seconds (default: 60)")
        }
      },
      async ({ url, css_selector, timeout }) => {
        try {
          // Check cache first
          const cachedResult = await this.cache.getCachedResult(url);
          if (cachedResult) {
            const summary = `✅ From cache: ${cachedResult.title}\n` +
                           `📄 URL: ${cachedResult.url}\n` +
                           `📊 Cached: ${cachedResult.cached_at}\n` +
                           `📝 Content: ${cachedResult.content_length} characters\n` +
                           `🔄 Access count: ${cachedResult.access_count}\n\n`;

            return {
              content: [{
                type: "text",
                text: summary + cachedResult.markdown
              }]
            };
          }

          // Build crawler config
          const config = css_selector ? { css_selector } : {};

          // Override timeout if specified
          if (timeout) {
            this.crawler = new SimpleCrawler({
              ...this.crawler,
              timeout: timeout * 1000
            });
          }

          const result = await this.crawler.scrapeUrl(url, config);

          if (!result.success) {
            return {
              content: [{
                type: "text",
                text: `❌ Failed to crawl ${url}: ${result.error}`
              }]
            };
          }

          // Cache the successful result
          await this.cache.cacheResult(result);

          // Token-efficient response for Claude
          const summary = `✅ Successfully crawled: ${result.title || 'Untitled'}\n` +
                         `📄 URL: ${result.url}\n` +
                         `📊 Status: ${result.status_code}\n` +
                         `📝 Content: ${result.content_length} characters\n` +
                         `💾 Cached for future use\n\n`;

          return {
            content: [{
              type: "text",
              text: summary + result.markdown
            }]
          };
        } catch (error) {
          const err = error as Error;
          return {
            content: [{
              type: "text",
              text: `❌ Crawler error: ${err.message}`
            }]
          };
        }
      }
    );

    // Tool: crawl-docs (batch URL processing)
    this.server.registerTool(
      "crawl-docs",
      {
        title: "Crawl Documentation",
        description: "Batch crawl multiple URLs with optimization presets",
        inputSchema: {
          urls: z.array(z.string().url()).describe("Array of URLs to crawl"),
          preset: z.enum(["docs", "news", "api"]).optional().describe("Configuration preset (docs: browser+careful, news: http+fast, api: http+balanced)"),
          strategy: z.enum(["browser", "http"]).optional().describe("Crawling strategy override"),
          max_sessions: z.number().min(1).max(20).optional().describe("Max concurrent sessions"),
          memory_threshold: z.number().min(50).max(95).optional().describe("Memory threshold percentage")
        }
      },
      async ({ urls, preset, strategy, max_sessions, memory_threshold }) => {
        try {
          if (urls.length === 0) {
            return {
              content: [{
                type: "text",
                text: "❌ No URLs provided"
              }]
            };
          }

          if (urls.length > 10) {
            return {
              content: [{
                type: "text",
                text: "❌ Maximum 10 URLs allowed per batch for performance"
              }]
            };
          }

          // Build batch options
          let batchOptions: BatchCrawlOptions = {};

          // Start with preset if specified
          if (preset) {
            batchOptions = getPreset(preset as PresetName);
          }

          // Apply overrides
          if (strategy) batchOptions.strategy = strategy;
          if (max_sessions) batchOptions.max_sessions = max_sessions;
          if (memory_threshold) batchOptions.memory_threshold = memory_threshold;

          const startTime = Date.now();
          const batchResult = await this.crawler.batchScrapeUrls(urls, batchOptions);
          const totalTime = Date.now() - startTime;

          // Cache all successful results
          for (const result of batchResult.results) {
            if (result.success) {
              await this.cache.cacheResult(result);
            }
          }

          // Create token-efficient summary
          const summary = `📊 Batch Results (${urls.length} URLs):\n` +
                         `✅ Successful: ${batchResult.successful_count}/${batchResult.results.length}\n` +
                         `❌ Failed: ${batchResult.failed_count}/${batchResult.results.length}\n` +
                         `📈 Success Rate: ${(batchResult.success_rate * 100).toFixed(1)}%\n` +
                         `⏱️  Total Time: ${(totalTime / 1000).toFixed(1)}s\n` +
                         `🚀 Speed: ${(batchResult.results.length / (totalTime / 1000)).toFixed(1)} URLs/sec\n\n`;

          // Combine all successful results
          const combinedMarkdown = batchResult.results
            .filter(r => r.success)
            .map(r => `# ${r.title || 'Untitled'}\n**Source:** ${r.url}\n\n${r.markdown}`)
            .join('\n\n---\n\n');

          // List failed URLs for debugging
          const failedUrls = batchResult.results
            .filter(r => !r.success)
            .map(r => `❌ ${r.url}: ${r.error}`)
            .join('\n');

          const responseText = summary +
                              (failedUrls ? `**Failed URLs:**\n${failedUrls}\n\n` : '') +
                              `**Combined Content:**\n\n${combinedMarkdown}`;

          return {
            content: [{
              type: "text",
              text: responseText
            }]
          };
        } catch (error) {
          const err = error as Error;
          return {
            content: [{
              type: "text",
              text: `❌ Batch crawl error: ${err.message}`
            }]
          };
        }
      }
    );

    // Tool: get-cached (retrieve cached content)
    this.server.registerTool(
      "get-cached",
      {
        title: "Get Cached Content",
        description: "Retrieve previously crawled content by URL",
        inputSchema: {
          url: z.string().url().describe("URL to retrieve from cache")
        }
      },
      async ({ url }) => {
        try {
          const cachedResult = await this.cache.getCachedResult(url);

          if (!cachedResult) {
            return {
              content: [{
                type: "text",
                text: `❌ No cached content found for: ${url}`
              }]
            };
          }

          const summary = `✅ Cached content: ${cachedResult.title}\n` +
                         `📄 URL: ${cachedResult.url}\n` +
                         `📊 Cached: ${cachedResult.cached_at}\n` +
                         `📝 Content: ${cachedResult.content_length} characters\n` +
                         `🔄 Access count: ${cachedResult.access_count}\n` +
                         `🏷️ Tokens: ${cachedResult.token_count}\n\n`;

          return {
            content: [{
              type: "text",
              text: summary + cachedResult.markdown
            }]
          };
        } catch (error) {
          const err = error as Error;
          return {
            content: [{
              type: "text",
              text: `❌ Cache retrieval error: ${err.message}`
            }]
          };
        }
      }
    );

    // Tool: search-cache (full-text search)
    this.server.registerTool(
      "search-cache",
      {
        title: "Search Cache",
        description: "Search cached content by text query",
        inputSchema: {
          query: z.string().describe("Search query (searches titles, URLs, and content)"),
          limit: z.number().min(1).max(20).optional().describe("Maximum results to return (default: 10)")
        }
      },
      async ({ query, limit = 10 }) => {
        try {
          const results = await this.cache.searchCache(query, limit);

          if (results.length === 0) {
            return {
              content: [{
                type: "text",
                text: `❌ No cached content found matching: "${query}"`
              }]
            };
          }

          const summary = `🔍 Search Results (${results.length} matches for "${query}"):\n\n`;

          const resultsList = results.map((result, index) =>
            `**${index + 1}. ${result.title}**\n` +
            `   URL: ${result.url}\n` +
            `   Cached: ${result.cached_at}\n` +
            `   Tokens: ${result.token_count}\n` +
            `   Access count: ${result.access_count}\n`
          ).join('\n');

          return {
            content: [{
              type: "text",
              text: summary + resultsList
            }]
          };
        } catch (error) {
          const err = error as Error;
          return {
            content: [{
              type: "text",
              text: `❌ Cache search error: ${err.message}`
            }]
          };
        }
      }
    );

    // Tool: list-cache (browse cache)
    this.server.registerTool(
      "list-cache",
      {
        title: "List Cache",
        description: "List all cached content with statistics",
        inputSchema: {
          limit: z.number().min(1).max(50).optional().describe("Maximum entries to list (default: 20)")
        }
      },
      async ({ limit = 20 }) => {
        try {
          const [entries, stats] = await Promise.all([
            this.cache.listCache(limit),
            this.cache.getCacheStats()
          ]);

          if (entries.length === 0) {
            return {
              content: [{
                type: "text",
                text: "📭 Cache is empty"
              }]
            };
          }

          const statsText = `📊 Cache Statistics:\n` +
                           `   Total entries: ${stats.total_entries}\n` +
                           `   Total size: ${stats.total_size_mb} MB\n` +
                           `   Total tokens: ${stats.total_tokens}\n` +
                           `   Most accessed: ${stats.most_accessed_url}\n` +
                           `   Oldest entry: ${stats.oldest_entry}\n` +
                           `   Newest entry: ${stats.newest_entry}\n\n`;

          const entriesList = `📋 Recent Entries (${entries.length} shown):\n\n` +
            entries.map((entry, index) =>
              `**${index + 1}. ${entry.title}**\n` +
              `   URL: ${entry.url}\n` +
              `   Cached: ${entry.cached_at}\n` +
              `   Tokens: ${entry.token_count} | Access count: ${entry.access_count}\n`
            ).join('\n');

          return {
            content: [{
              type: "text",
              text: statsText + entriesList
            }]
          };
        } catch (error) {
          const err = error as Error;
          return {
            content: [{
              type: "text",
              text: `❌ Cache listing error: ${err.message}`
            }]
          };
        }
      }
    );

    // Tool: clear-cache (cache management)
    this.server.registerTool(
      "clear-cache",
      {
        title: "Clear Cache",
        description: "Clear all cached crawled content",
        inputSchema: {}
      },
      async () => {
        try {
          await this.cache.clearCache();

          return {
            content: [{
              type: "text",
              text: "✅ Cache cleared successfully"
            }]
          };
        } catch (error) {
          const err = error as Error;
          return {
            content: [{
              type: "text",
              text: `❌ Failed to clear cache: ${err.message}`
            }]
          };
        }
      }
    );
  }

  /**
   * Register MCP resources (data access)
   *
   * Note: Resources are handled through tools in this implementation
   * for better integration with the caching system.
   */
  private registerResources(): void {
    // Resources are implemented as tools (get-cached, search-cache, list-cache)
    // This provides better control over caching logic and token management.
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      // Server is now running and listening on stdin/stdout
      console.error('🕷️  MCP Web Crawler Server started');
      console.error('📡 Listening for MCP messages via stdio');
    } catch (error) {
      const err = error as Error;
      console.error(`❌ Failed to start MCP server: ${err.message}`);
      process.exit(1);
    }
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const server = new McpWebCrawlerServer();
  await server.start();
}

// Handle process events
process.on('uncaughtException', (error: Error) => {
  console.error(`❌ Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error(`❌ Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Only run main function if this file is executed directly
if (require.main === module) {
  main();
}

export { McpWebCrawlerServer };