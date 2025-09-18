# TypeScript Migration Guide for Web Crawler

## Migration Overview
This guide provides step-by-step instructions for converting the existing JavaScript crawler to TypeScript, following the learning-by-doing methodology. Each step includes educational context explaining why specific choices are made.

## Phase 1: Project Setup

### Step 1: Install TypeScript Dependencies
```bash
# Install TypeScript and Node.js type definitions
npm install --save-dev typescript @types/node

# Optional: Install ts-node for development
npm install --save-dev ts-node nodemon
```

**Why these dependencies?**
- `typescript`: The TypeScript compiler itself
- `@types/node`: Type definitions for Node.js built-in modules (like `child_process`, `fs`, `path`)
- `ts-node`: Allows running TypeScript directly without compilation step (development convenience)
- `nodemon`: Watches for file changes and restarts (development convenience)

### Step 2: Create tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2016",
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "sourceMap": true,
    "resolveJsonModule": true
  },
  "include": [
    "src/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.js"
  ]
}
```

**Configuration Rationale:**
- **`target: "ES2016"`**: Modern JavaScript features while maintaining Node.js compatibility
- **`strict: true`**: Enables all strict type checking - catches more potential errors
- **`declaration: true`**: Generates `.d.ts` files for potential library usage in Phase 3
- **`sourceMap: true`**: Enables debugging TypeScript directly in IDEs

### Step 3: Update package.json Scripts
```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "dev": "nodemon --exec ts-node src/index.ts",
    "start": "node dist/index.js",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist",
    "test": "ts-node test.ts"
  }
}
```

**Script Purpose:**
- **`build`**: Compile TypeScript to JavaScript
- **`dev`**: Development mode with auto-restart on changes
- **`type-check`**: Check types without generating files (useful for CI)

## Phase 2: File Structure Reorganization

### Step 1: Create src/ Directory Structure
```
src/
├── types/
│   └── index.ts          # Central type definitions
├── crawler.ts            # Main crawler class (converted from crawler.js)
├── test.ts              # Test suite (converted from test.js)
└── index.ts             # Main entry point
```

**Why this structure?**
- **`src/` directory**: Separates source from compiled output
- **`types/` subdirectory**: Centralizes type definitions for reusability
- **Clear naming**: Each file has a single, clear responsibility

### Step 2: Create Central Type Definitions
Create `src/types/index.ts`:

```typescript
/**
 * Result returned by the Python scraping process
 * This interface defines the contract between Python and Node.js
 */
export interface ScrapeResult {
  success: boolean;
  markdown: string;
  url: string;
  status_code: number;
  title: string;
  content_length: number;
  error: string | null;
}

/**
 * Configuration options for the crawler instance
 * These control Node.js behavior and Python subprocess management
 */
export interface CrawlerOptions {
  pythonPath?: string;
  timeout?: number;
  outputFile?: string | null;
  verbose?: boolean;
}

/**
 * Configuration passed to the Python scraping script
 * These options control crawl4ai behavior
 */
export interface CrawlerConfig {
  css_selector?: string;
  excluded_tags?: string[];
  word_count_threshold?: number;
  page_timeout?: number;
}

/**
 * Log levels for the test runner
 * Using union types for type-safe string constants
 */
export type LogLevel = 'info' | 'success' | 'error' | 'warn';

/**
 * Test result tracking interface
 */
export interface TestResult {
  passed: number;
  failed: number;
  total: number;
}
```

**Interface Design Principles:**
- **Clear documentation**: Each interface explains its purpose and usage context
- **Separation of concerns**: Different interfaces for different layers (Node.js vs Python)
- **Optional properties**: Use `?` for properties that have sensible defaults
- **Union types**: Type-safe alternatives to magic strings

## Phase 3: Convert crawler.js to TypeScript

### Step 1: Basic Conversion
Create `src/crawler.ts`:

```typescript
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import type { ScrapeResult, CrawlerOptions, CrawlerConfig } from './types';

export class SimpleCrawler {
  private readonly pythonPath: string;
  private readonly scriptPath: string;
  private readonly timeout: number;
  private readonly outputFile: string | null;
  private readonly verbose: boolean;

  constructor(options: CrawlerOptions = {}) {
    this.pythonPath = options.pythonPath || 'python3.11';
    this.scriptPath = path.join(__dirname, '..', 'scripts', 'scrape.py');
    this.timeout = options.timeout || 60000;
    this.outputFile = options.outputFile || null;
    this.verbose = options.verbose || false;
  }

  /**
   * Validate that Python script exists and is executable
   */
  private checkSetup(): void {
    if (!fs.existsSync(this.scriptPath)) {
      throw new Error(`Python script not found: ${this.scriptPath}`);
    }
  }

  /**
   * Log message if verbose mode is enabled
   */
  private log(message: string): void {
    if (this.verbose) {
      console.error(`[CRAWLER] ${message}`);
    }
  }

  /**
   * Scrape a single URL and return the result
   */
  async scrapeUrl(url: string, config: CrawlerConfig = {}): Promise<ScrapeResult> {
    this.checkSetup();
    
    return new Promise<ScrapeResult>((resolve, reject) => {
      const args = [this.scriptPath, url];
      
      // Add config as JSON string if provided
      if (Object.keys(config).length > 0) {
        args.push(JSON.stringify(config));
      }

      this.log(`Starting crawl: ${url}`);
      const process = spawn(this.pythonPath, args);
      
      let stdout = '';
      let stderr = '';
      
      // Set up timeout
      const timer = setTimeout(() => {
        process.kill('SIGTERM');
        reject(new Error(`Scraping timeout after ${this.timeout}ms`));
      }, this.timeout);

      process.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      process.on('close', (code: number | null) => {
        clearTimeout(timer);
        
        try {
          const result: ScrapeResult = JSON.parse(stdout);
          this.log(`Crawl completed: ${result.success ? 'SUCCESS' : 'FAILED'}`);
          resolve(result);
        } catch (e) {
          // If we can't parse JSON and process failed, provide error details
          if (code !== 0) {
            reject(new Error(`Python process failed (code ${code}): ${stderr}`));
          } else {
            const error = e as Error;
            reject(new Error(`Failed to parse result: ${error.message}\nOutput: ${stdout.substring(0, 500)}`));
          }
        }
      });

      process.on('error', (error: Error) => {
        clearTimeout(timer);
        reject(new Error(`Failed to spawn Python process: ${error.message}`));
      });
    });
  }

  /**
   * Format the result for display
   */
  formatResult(result: ScrapeResult): string {
    if (!result.success) {
      return `❌ Error: ${result.error}\nURL: ${result.url}`;
    }

    const stats = [
      `✅ Successfully scraped: ${result.url}`,
      `📄 Title: ${result.title || 'N/A'}`,
      `📊 Status: ${result.status_code}`,
      `📝 Content: ${result.content_length} characters`,
      `🕒 Ready for Claude!`
    ].join('\n');

    return `${stats}\n\n${'='.repeat(80)}\n${result.markdown}\n${'='.repeat(80)}`;
  }

  /**
   * Save result to file if outputFile is specified
   */
  async saveResult(result: ScrapeResult, filename?: string): Promise<void> {
    const targetFile = filename || this.outputFile;
    if (!targetFile) return;

    try {
      const content = result.success ? result.markdown : `Error: ${result.error}`;
      fs.writeFileSync(targetFile, content, 'utf8');
      console.error(`💾 Saved to: ${targetFile}`);
    } catch (error) {
      const err = error as Error;
      console.error(`❌ Failed to save file: ${err.message}`);
    }
  }
}
```

**TypeScript Improvements Explained:**

1. **Type Imports**: `import type` for interfaces - these are erased at runtime
2. **Access Modifiers**: `private` for internal methods, `public` for API methods
3. **Type Annotations**: Every parameter and return type is explicitly typed
4. **Generic Promises**: `Promise<ScrapeResult>` ensures type safety for async operations
5. **Buffer Types**: Proper typing for `data: Buffer` in event handlers
6. **Error Handling**: Type assertions for error objects to access `.message` property

### Step 2: Type-Safe Event Handling
The Node.js `child_process` events now have proper types:

```typescript
// Before (JavaScript) - No type safety
process.stdout.on('data', (data) => {
  stdout += data.toString(); // data could be anything
});

// After (TypeScript) - Type safe
process.stdout.on('data', (data: Buffer) => {
  stdout += data.toString(); // TypeScript knows data is a Buffer
});
```

## Phase 4: Convert test.js to TypeScript

Create `src/test.ts`:

```typescript
import type { ScrapeResult, LogLevel, TestResult } from './types';
import { SimpleCrawler } from './crawler';

class CrawlerTester {
  private crawler: SimpleCrawler;
  private passed: number = 0;
  private failed: number = 0;

  constructor() {
    this.crawler = new SimpleCrawler({ verbose: true, timeout: 30000 });
  }

  private log(message: string, type: LogLevel = 'info'): void {
    const prefix: Record<LogLevel, string> = {
      'info': '🧪',
      'success': '✅', 
      'error': '❌',
      'warn': '⚠️'
    };
    console.log(`${prefix[type]} ${message}`);
  }

  async testUrl(
    url: string, 
    expectedSuccess: boolean = true, 
    description: string = ''
  ): Promise<void> {
    const testName = description || url;
    this.log(`Testing: ${testName}`);
    
    try {
      const result = await this.crawler.scrapeUrl(url);
      
      if (result.success === expectedSuccess) {
        this.log(`PASS: ${testName}`, 'success');
        if (result.success) {
          this.log(`  - Title: ${result.title || 'N/A'}`);
          this.log(`  - Status: ${result.status_code}`);
          this.log(`  - Content: ${result.content_length} chars`);
          this.log(`  - Preview: ${result.markdown.substring(0, 100).replace(/\n/g, ' ')}...`);
        }
        this.passed++;
      } else {
        this.log(`FAIL: ${testName} - Expected ${expectedSuccess ? 'success' : 'failure'} but got ${result.success ? 'success' : 'failure'}`, 'error');
        if (result.error) {
          this.log(`  - Error: ${result.error}`);
        }
        this.failed++;
      }
    } catch (error) {
      const err = error as Error;
      this.log(`ERROR: ${testName} - ${err.message}`, 'error');
      this.failed++;
    }
    
    console.log(''); // Add spacing between tests
  }

  async runBasicTests(): Promise<void> {
    this.log('🚀 Running Phase 1 Basic Crawler Tests\n');

    // Test 1: Simple HTML page
    await this.testUrl(
      'https://httpbin.org/html',
      true,
      'Simple HTML page (httpbin.org)'
    );

    // Test 2: Documentation site
    await this.testUrl(
      'https://docs.python.org/3/library/json.html',
      true,
      'Python documentation'
    );

    // Test 3: Modern JS site
    await this.testUrl(
      'https://quotes.toscrape.com/',
      true,
      'Quotes to scrape (test site)'
    );

    // Test 4: Invalid URL (should fail)
    await this.testUrl(
      'https://definitely-not-a-real-site-12345.com',
      false,
      'Invalid URL (should fail)'
    );

    // Test 5: Malformed URL (should fail during validation)
    await this.testUrl(
      'not-a-url',
      false,
      'Malformed URL (should fail)'
    );
  }

  async testConfiguration(): Promise<void> {
    this.log('🔧 Testing Configuration Options\n');

    // Test with custom CSS selector
    await this.testUrl(
      'https://httpbin.org/html',
      true,
      'Custom CSS selector test'
    );
  }

  showSummary(): boolean {
    this.log('\n📊 Test Summary:');
    this.log(`  Passed: ${this.passed}`);
    this.log(`  Failed: ${this.failed}`);
    this.log(`  Total:  ${this.passed + this.failed}`);
    
    if (this.failed === 0) {
      this.log('\n🎉 All tests passed! Phase 1 crawler is working correctly.', 'success');
      this.log('\nNext steps:');
      this.log('  1. Test with your target websites');
      this.log('  2. Use for daily Claude work');
      this.log('  3. Identify needs for Phase 2 features');
    } else {
      this.log(`\n⚠️  ${this.failed} test(s) failed. Check the errors above.`, 'warn');
    }
    
    return this.failed === 0;
  }

  getResults(): TestResult {
    return {
      passed: this.passed,
      failed: this.failed,
      total: this.passed + this.failed
    };
  }
}

async function main(): Promise<void> {
  console.log('Prerequisites check:');
  console.log('- Python 3.8+ installed');
  console.log('- Crawl4AI installed: pip install crawl4ai');
  console.log('- Crawl4AI setup complete: crawl4ai-setup\n');

  const tester = new CrawlerTester();
  
  try {
    await tester.runBasicTests();
    await tester.testConfiguration();
    
    const allPassed = tester.showSummary();
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    const err = error as Error;
    console.error(`❌ Test suite failed: ${err.message}`);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}

export { CrawlerTester };
```

**TypeScript Test Improvements:**

1. **Type-Safe Log Levels**: `LogLevel` union type prevents typos in log calls
2. **Structured Test Results**: `TestResult` interface for programmatic access to results
3. **Error Type Assertions**: `error as Error` to safely access error properties
4. **Method Return Types**: All methods have explicit return types
5. **Export for Reusability**: Class can be imported by other test files

## Phase 5: Create Main Entry Point

Create `src/index.ts`:

```typescript
import type { CrawlerOptions, CrawlerConfig } from './types';
import { SimpleCrawler } from './crawler';

/**
 * Parse command line arguments into structured options
 */
function parseArgs(args: string[]): { url: string | null; options: CrawlerOptions & { config: CrawlerConfig; help: boolean } } {
  const options = {
    help: false,
    verbose: false,
    timeout: 60000,
    outputFile: null as string | null,
    config: {} as CrawlerConfig
  };

  let url: string | null = null;
  
  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    
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
        options.outputFile = args[++i];
        break;
      case '--timeout':
      case '-t':
        options.timeout = parseInt(args[++i]) * 1000;
        break;
      case '--selector':
      case '-s':
        options.config.css_selector = args[++i];
        break;
      default:
        if (!url && !arg.startsWith('-')) {
          url = arg;
        }
        break;
    }
  }
  
  return { url, options };
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(`
🕷️  Simple Web Crawler - Phase 1 TypeScript Implementation

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

Phase 1 Goal:
  Simple URL → Clean Markdown conversion for Claude usage
`);
}

/**
 * Main execution function
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

  const crawler = new SimpleCrawler({
    timeout: options.timeout,
    outputFile: options.outputFile,
    verbose: options.verbose
  });

  try {
    console.error('🕷️  Starting web crawl...');
    const result = await crawler.scrapeUrl(url, options.config);
    
    // Save to file if requested
    if (options.outputFile) {
      await crawler.saveResult(result, options.outputFile);
    }
    
    // Output formatted result
    console.log(crawler.formatResult(result));
    
    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);
    
  } catch (error) {
    const err = error as Error;
    console.error(`❌ Crawler failed: ${err.message}`);
    process.exit(1);
  }
}

// Handle uncaught exceptions with proper typing
process.on('uncaughtException', (error: Error) => {
  console.error(`❌ Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error(`❌ Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Run main function only if this file is executed directly
if (require.main === module) {
  main();
}

// Export the main function for potential testing
export { main };
```

## Phase 6: Build and Test

### Step 1: Compile TypeScript
```bash
npm run build
```

This generates the `dist/` directory with compiled JavaScript files.

### Step 2: Test the Migration
```bash
# Test using TypeScript directly
npm run dev https://httpbin.org/html

# Test compiled JavaScript
npm start https://httpbin.org/html

# Run test suite
npm test
```

### Step 3: Verify Type Safety
```bash
# Check types without compilation
npm run type-check
```

## Benefits Gained from Migration

### 1. **Immediate Developer Experience**
- **Auto-completion**: IDE now provides suggestions for all interface properties
- **Error Detection**: Typos and type mismatches caught before runtime
- **Refactoring Safety**: Rename methods/properties with confidence across all files

### 2. **Code Quality Improvements**
- **Interface Contracts**: Clear boundaries between Node.js and Python layers
- **Documentation**: Types serve as living documentation of expected data shapes
- **Consistent Error Handling**: Structured approach to success/failure states

### 3. **Future-Proofing**
- **Phase 2 Ready**: Type-safe foundation for adding new features
- **MCP Integration**: Structured approach to implementing protocol requirements
- **Team Collaboration**: Clear interfaces for multiple contributors

### 4. **Learning Outcomes**
- **Type System Understanding**: Practical experience with TypeScript's type system
- **Interface Design**: Best practices for creating maintainable type definitions
- **Migration Strategy**: Systematic approach to converting existing JavaScript projects

This migration transforms the codebase from "guess what properties exist" to "know exactly what's available with full IDE support" - a fundamental improvement in developer experience and code reliability.