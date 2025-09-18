#!/usr/bin/env node

/**
 * Main entry point for the TypeScript Web Crawler
 * 
 * Demonstrates type-safe CLI argument parsing, error handling,
 * and integration of all TypeScript components.
 * 
 * Learning: This shows how TypeScript transforms a complex main function
 * from error-prone string manipulation to type-safe, self-documenting code.
 */

import type { CrawlerOptions, CrawlerConfig, BatchCrawlOptions } from './types';
import { SimpleCrawler } from './crawler';
import { getPreset, listPresets, getPresetDescriptions, mergePresetWithOptions, type PresetName } from './config';
import fs from 'fs';

/**
 * Read URLs from a file or stdin
 * 
 * @param source - File path or '-' for stdin
 * @returns Array of URLs (empty lines filtered out)
 */
function readUrlsFromSource(source: string): string[] {
  try {
    if (source === '-') {
      // Read from stdin synchronously
      const stdinInput = fs.readFileSync(0, 'utf8'); // 0 = stdin file descriptor
      return stdinInput.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#')); // Filter empty lines and comments
    } else {
      // Read from file
      if (!fs.existsSync(source)) {
        throw new Error(`Batch file not found: ${source}`);
      }
      
      const fileContent = fs.readFileSync(source, 'utf8');
      return fileContent.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#')); // Filter empty lines and comments
    }
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to read URLs from ${source}: ${err.message}`);
  }
}

/**
 * Validate that URLs are properly formatted
 * 
 * @param urls - Array of URLs to validate
 * @returns Array of validation results
 */
function validateUrls(urls: string[]): { valid: string[]; invalid: { url: string; reason: string }[] } {
  const valid: string[] = [];
  const invalid: { url: string; reason: string }[] = [];
  
  for (const url of urls) {
    try {
      new URL(url); // This will throw if URL is invalid
      if (url.startsWith('http://') || url.startsWith('https://')) {
        valid.push(url);
      } else {
        invalid.push({ url, reason: 'Must start with http:// or https://' });
      }
    } catch {
      invalid.push({ url, reason: 'Invalid URL format' });
    }
  }
  
  return { valid, invalid };
}

/**
 * Build batch crawl options from CLI arguments and presets
 * 
 * @param options - Parsed CLI options
 * @returns Batch crawl configuration
 */
function buildBatchOptions(options: ExtendedCliOptions): BatchCrawlOptions {
  let batchOptions: BatchCrawlOptions = {};
  
  // Start with preset if specified
  if (options.preset) {
    try {
      batchOptions = getPreset(options.preset);
    } catch (error) {
      const err = error as Error;
      throw new Error(`Invalid preset: ${err.message}`);
    }
  }
  
  // Override with explicit CLI options
  const customOptions: Partial<BatchCrawlOptions> = {};
  
  if (options.strategy) customOptions.strategy = options.strategy;
  if (options.maxSessions !== null) customOptions.max_sessions = options.maxSessions;
  if (options.memoryThreshold !== null) customOptions.memory_threshold = options.memoryThreshold;
  if (options.maxConnections !== null) customOptions.max_connections = options.maxConnections;
  
  // Merge with preset or use custom options directly
  if (options.preset) {
    batchOptions = mergePresetWithOptions(options.preset, customOptions);
  } else {
    // Use defaults if no preset specified
    batchOptions = {
      strategy: 'browser',
      memory_threshold: 75.0,
      max_sessions: 10,
      enable_rate_limiting: true,
      ...customOptions
    };
  }
  
  return batchOptions;
}

/**
 * Type-safe command line argument parser
 * 
 * Learning: Return type annotation documents exactly what this function produces,
 * making it impossible to accidentally use wrong property names later.
 */
/**
 * Extended CLI options for batch processing support
 */
interface ExtendedCliOptions extends CrawlerOptions {
  config: CrawlerConfig;
  help: boolean;
  batch: string | null;
  strategy: 'browser' | 'http' | null;
  preset: string | null;
  maxSessions: number | null;
  memoryThreshold: number | null;
  maxConnections: number | null;
}

function parseArgs(args: string[]): { 
  url: string | null; 
  options: ExtendedCliOptions 
} {
  const options: ExtendedCliOptions = {
    help: false,
    verbose: false,
    timeout: 60000,
    outputFile: null as string | null,
    config: {} as CrawlerConfig,
    // New batch processing options
    batch: null,
    strategy: null,
    preset: null,
    maxSessions: null,
    memoryThreshold: null,
    maxConnections: null
  };

  let url: string | null = null;
  
  // Type-safe iteration over arguments
  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    
    // Type-safe switch statement
    // Learning: TypeScript ensures all cases are handled properly
    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;
        
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
        
      case '--output':
      case '-o':
        // Type-safe array access with bounds checking
        if (i + 1 < args.length) {
          const nextArg = args[++i];
          if (nextArg !== undefined) {
            options.outputFile = nextArg;
          }
        }
        break;
        
      case '--timeout':
      case '-t':
        // Type-safe number parsing with validation
        if (i + 1 < args.length) {
          const timeoutStr = args[++i];
          if (timeoutStr !== undefined) {
            const timeoutNum = parseInt(timeoutStr);
            if (!isNaN(timeoutNum)) {
              options.timeout = timeoutNum * 1000; // Convert to milliseconds
            }
          }
        }
        break;
        
      case '--selector':
      case '-s':
        // Type-safe config object assignment
        if (i + 1 < args.length) {
          const selector = args[++i];
          if (selector !== undefined) {
            options.config.css_selector = selector;
          }
        }
        break;
        
      case '--batch':
      case '-b':
        // Batch processing: file path or '-' for stdin
        if (i + 1 < args.length) {
          const batchSource = args[++i];
          if (batchSource !== undefined) {
            options.batch = batchSource;
          }
        }
        break;
        
      case '--strategy':
        // Choose crawling strategy: browser or http
        if (i + 1 < args.length) {
          const strategy = args[++i];
          if (strategy === 'browser' || strategy === 'http') {
            options.strategy = strategy;
          }
        }
        break;
        
      case '--preset':
      case '-p':
        // Use configuration preset
        if (i + 1 < args.length) {
          const preset = args[++i];
          if (preset !== undefined) {
            options.preset = preset;
          }
        }
        break;
        
      case '--max-sessions':
        // Configure maximum concurrent sessions
        if (i + 1 < args.length) {
          const sessionsStr = args[++i];
          if (sessionsStr !== undefined) {
            const sessions = parseInt(sessionsStr);
            if (!isNaN(sessions)) {
              options.maxSessions = sessions;
            }
          }
        }
        break;
        
      case '--memory-threshold':
        // Configure memory threshold percentage
        if (i + 1 < args.length) {
          const thresholdStr = args[++i];
          if (thresholdStr !== undefined) {
            const threshold = parseFloat(thresholdStr);
            if (!isNaN(threshold)) {
              options.memoryThreshold = threshold;
            }
          }
        }
        break;
        
      case '--max-connections':
        // Configure maximum HTTP connections (HTTP strategy only)
        if (i + 1 < args.length) {
          const connectionsStr = args[++i];
          if (connectionsStr !== undefined) {
            const connections = parseInt(connectionsStr);
            if (!isNaN(connections)) {
              options.maxConnections = connections;
            }
          }
        }
        break;
        
      default:
        // Only assign URL if it doesn't start with dash and we don't have one yet
        if (!url && arg && !arg.startsWith('-')) {
          url = arg;
        }
        break;
    }
  }
  
  return { url, options };
}

/**
 * Display help message
 * 
 * Learning: Simple void function with clear single responsibility
 */
function showHelp(): void {
  const presetDescriptions = getPresetDescriptions();
  const availablePresets = listPresets().join(', ');
  
  console.log(`
🕷️  Web Crawler - TypeScript + Crawl4AI v0.7.x

Usage:
  npm run dev <url> [options]          # Single URL crawling
  npm run dev --batch <file> [options] # Batch URL crawling
  npm start <url> [options]            # Production single URL
  npm start --batch <file> [options]   # Production batch crawling

Single URL Arguments:
  url                    URL to scrape (required for single mode)

Batch Processing:
  -b, --batch <file>     Read URLs from file (one per line)
  -b, --batch -          Read URLs from stdin
      --strategy <type>  Crawling strategy: browser (default) | http
  -p, --preset <name>    Use configuration preset: ${availablePresets}

Performance Tuning:
      --max-sessions <n>     Maximum concurrent sessions (default: varies by preset)
      --memory-threshold <n> Memory threshold percentage 0-100 (default: varies by preset)
      --max-connections <n>  HTTP connections for http strategy (default: 20)

General Options:
  -h, --help            Show this help message
  -v, --verbose         Enable verbose logging
  -o, --output <file>   Save markdown to file
  -t, --timeout <sec>   Timeout in seconds (default: 60)
  -s, --selector <css>  Custom CSS selector for content

Configuration Presets:
${Object.entries(presetDescriptions).map(([name, desc]) => `  ${name.padEnd(4)} - ${desc}`).join('\n')}

Examples:
  # Single URL crawling
  npm run dev https://example.com
  npm run dev https://docs.python.org/3/ --output python-docs.md
  
  # Batch crawling with presets
  npm run dev --batch urls.txt --preset docs
  npm run dev --batch - --preset news --strategy http < urls.txt
  
  # Custom batch configuration
  npm run dev --batch urls.txt --strategy http --max-sessions 15 --memory-threshold 80

Prerequisites:
  - Python 3.11+ with crawl4ai v0.7.x installed
  - Run: pip install crawl4ai && crawl4ai-setup

v0.7.x Features:
  - Native batch processing with MemoryAdaptiveDispatcher
  - HTTP-only strategy for 20-100x faster simple content crawling
  - Intelligent memory management and rate limiting
  - Optimized for MCP server integration with Claude Code
`);
}

/**
 * Main execution function with comprehensive error handling
 * 
 * Learning: Explicit Promise<void> return type and type-safe error handling
 * throughout the entire execution flow
 */
async function main(): Promise<void> {
  const { url, options } = parseArgs(process.argv);

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  // Type-safe crawler instantiation
  const crawlerOptions: CrawlerOptions = {};
  
  // Only set properties that have values to maintain type safety
  if (options.timeout !== undefined) crawlerOptions.timeout = options.timeout;
  if (options.outputFile !== undefined) crawlerOptions.outputFile = options.outputFile;
  if (options.verbose !== undefined) crawlerOptions.verbose = options.verbose;
  
  const crawler = new SimpleCrawler(crawlerOptions);

  try {
    // Determine mode: batch processing or single URL
    if (options.batch) {
      // ===== BATCH PROCESSING MODE =====
      console.error('🕷️  Starting batch crawl with v0.7.x native processing...');
      
      // Read URLs from file or stdin
      const urls = readUrlsFromSource(options.batch);
      if (urls.length === 0) {
        console.error('❌ Error: No URLs found in batch source');
        process.exit(1);
      }
      
      // Validate URLs
      const { valid, invalid } = validateUrls(urls);
      if (invalid.length > 0) {
        console.error(`⚠️  Warning: ${invalid.length} invalid URLs found:`);
        invalid.forEach(({ url, reason }) => {
          console.error(`   - ${url}: ${reason}`);
        });
      }
      
      if (valid.length === 0) {
        console.error('❌ Error: No valid URLs to process');
        process.exit(1);
      }
      
      console.error(`📋 Processing ${valid.length} URLs (batch mode)...`);
      if (options.preset) {
        console.error(`🔧 Using preset: ${options.preset}`);
      }
      if (options.strategy) {
        console.error(`⚡ Strategy: ${options.strategy}`);
      }
      
      // Build batch options from CLI arguments and presets
      const batchOptions = buildBatchOptions(options);
      
      // Execute batch crawling using existing TypeScript integration
      const startTime = Date.now();
      const batchResult = await crawler.batchScrapeUrls(valid, batchOptions);
      const totalTime = Date.now() - startTime;
      
      // Display results summary
      console.error(`\n📊 Batch Results Summary:`);
      console.error(`   ✅ Successful: ${batchResult.successful_count}/${batchResult.results.length}`);
      console.error(`   ❌ Failed: ${batchResult.failed_count}/${batchResult.results.length}`);
      console.error(`   📈 Success Rate: ${(batchResult.success_rate * 100).toFixed(1)}%`);
      console.error(`   ⏱️  Total Time: ${(totalTime / 1000).toFixed(1)}s`);
      console.error(`   🚀 Average Speed: ${(batchResult.results.length / (totalTime / 1000)).toFixed(1)} URLs/sec`);
      
      // Output individual results
      for (const result of batchResult.results) {
        if (result.success) {
          console.log(`\n=== ${result.url} ===`);
          console.log(result.markdown);
        } else {
          console.error(`❌ Failed ${result.url}: ${result.error || 'Unknown error'}`);
        }
      }
      
      // Save batch results to file if requested
      if (options.outputFile) {
        const batchMarkdown = batchResult.results
          .filter(r => r.success)
          .map(r => `# ${r.title || 'Untitled'}\n\n**Source:** ${r.url}\n\n${r.markdown}`)
          .join('\n\n---\n\n');
        
        fs.writeFileSync(options.outputFile, batchMarkdown, 'utf8');
        console.error(`💾 Batch results saved to: ${options.outputFile}`);
      }
      
      // Exit with appropriate code
      process.exit(batchResult.success_rate > 0.5 ? 0 : 1);
      
    } else {
      // ===== SINGLE URL MODE =====
      if (!url) {
        console.error('❌ Error: URL is required for single URL mode');
        console.error('Use --batch for batch processing or --help for usage information');
        process.exit(1);
      }
      
      console.error('🕷️  Starting single URL crawl...');
      
      // Type-safe method call with guaranteed return type
      const result = await crawler.scrapeUrl(url, options.config);
      
      // Save to file if requested - type-safe optional parameter
      if (options.outputFile) {
        await crawler.saveResult(result, options.outputFile);
      }
      
      // Type-safe method call - formatResult is guaranteed to exist and return string
      console.log(crawler.formatResult(result));
      
      // Exit with appropriate code based on result
      process.exit(result.success ? 0 : 1);
    }
    
  } catch (error) {
    // Type-safe error handling with assertion
    const err = error as Error;
    console.error(`❌ Crawler failed: ${err.message}`);
    if (options.verbose) {
      console.error(`Stack trace: ${err.stack}`);
    }
    process.exit(1);
  }
}

// Type-safe process event handlers
// Learning: Error parameter types ensure we handle the right data structures
process.on('uncaughtException', (error: Error) => {
  console.error(`❌ Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error(`❌ Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Only run main function if this file is executed directly
// Learning: This pattern allows the file to be both executable and importable
if (require.main === module) {
  main();
}

// Export the main function for potential testing or reuse
export { main, parseArgs, showHelp };