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

import type { CrawlerOptions, CrawlerConfig } from './types';
import { SimpleCrawler } from './crawler';

/**
 * Type-safe command line argument parser
 * 
 * Learning: Return type annotation documents exactly what this function produces,
 * making it impossible to accidentally use wrong property names later.
 */
function parseArgs(args: string[]): { 
  url: string | null; 
  options: CrawlerOptions & { config: CrawlerConfig; help: boolean } 
} {
  const options = {
    help: false,
    verbose: false,
    timeout: 60000,
    outputFile: null as string | null,  // Explicit null type
    config: {} as CrawlerConfig         // Type assertion for empty config
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
  console.log(`
🕷️  Simple Web Crawler - TypeScript Implementation

Usage:
  npm run dev <url> [options]
  npm start <url> [options]

Arguments:
  url                    URL to scrape (required)

Options:
  -h, --help            Show this help message
  -v, --verbose         Enable verbose logging
  -o, --output <file>   Save markdown to file
  -t, --timeout <sec>   Timeout in seconds (default: 60)
  -s, --selector <css>  Custom CSS selector for content

Examples:
  npm run dev https://example.com
  npm run dev https://docs.python.org/3/ --output python-docs.md
  npm run dev https://fastapi.tiangolo.com --selector "main.content" --verbose

Prerequisites:
  - Python 3.8+ with crawl4ai installed
  - Run: pip install crawl4ai && crawl4ai-setup

TypeScript Benefits:
  - Full IntelliSense auto-completion for all crawler methods
  - Compile-time type checking prevents runtime errors
  - Self-documenting interfaces and function signatures
  - Safe refactoring with IDE support
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

  if (!url) {
    console.error('❌ Error: URL is required');
    console.error('Use --help for usage information');
    process.exit(1);
  }

  // Type-safe crawler instantiation
  // Learning: TypeScript ensures only valid options are passed
  const crawlerOptions: CrawlerOptions = {};
  
  // Only set properties that have values to maintain type safety
  if (options.timeout !== undefined) crawlerOptions.timeout = options.timeout;
  if (options.outputFile !== undefined) crawlerOptions.outputFile = options.outputFile;
  if (options.verbose !== undefined) crawlerOptions.verbose = options.verbose;
  
  const crawler = new SimpleCrawler(crawlerOptions);

  try {
    console.error('🕷️  Starting TypeScript web crawl...');
    
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
    
  } catch (error) {
    // Type-safe error handling with assertion
    const err = error as Error;
    console.error(`❌ TypeScript crawler failed: ${err.message}`);
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