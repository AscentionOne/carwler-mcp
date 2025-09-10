import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import type { ScrapeResult, CrawlerOptions, CrawlerConfig } from './types';

/**
 * Simple Web Crawler - TypeScript Implementation
 * 
 * Converts URLs to clean markdown using Python's crawl4ai library.
 * This TypeScript version provides full type safety and IntelliSense support.
 * 
 * Learning: Notice how TypeScript transforms this from "guess what properties exist"
 * to "know exactly what's available with IDE auto-completion"
 */
export class SimpleCrawler {
  // Class properties with explicit types
  // Learning: These are now compile-time validated and auto-completable
  private readonly pythonPath: string;
  private readonly scriptPath: string;
  private readonly timeout: number;
  private readonly outputFile: string | null;
  private readonly verbose: boolean;

  /**
   * Create a new SimpleCrawler instance
   * 
   * @param options Configuration options with sensible defaults
   * 
   * Learning: The CrawlerOptions interface ensures only valid options
   * can be passed, and IDE will auto-complete available properties
   */
  constructor(options: CrawlerOptions = {}) {
    // Type-safe property assignment with defaults
    // Learning: TypeScript ensures options.timeout is number | undefined
    this.pythonPath = options.pythonPath || 'python3.11';
    this.scriptPath = path.join(__dirname, '..', 'scripts', 'scrape.py');
    this.timeout = options.timeout || 60000;
    this.outputFile = options.outputFile || null;
    this.verbose = options.verbose || false;
  }

  /**
   * Validate that Python script exists and is executable
   * 
   * Learning: Private methods are now explicitly marked and type-checked
   */
  private checkSetup(): void {
    if (!fs.existsSync(this.scriptPath)) {
      throw new Error(`Python script not found: ${this.scriptPath}`);
    }
  }

  /**
   * Log message if verbose mode is enabled
   * 
   * @param message Message to log
   * 
   * Learning: Parameter types prevent passing non-strings accidentally
   */
  private log(message: string): void {
    if (this.verbose) {
      console.error(`[CRAWLER] ${message}`);
    }
  }

  /**
   * Scrape a single URL and return the result
   * 
   * @param url URL to scrape (must be valid HTTP/HTTPS)
   * @param config Optional crawl4ai configuration
   * @returns Promise resolving to structured scrape result
   * 
   * Learning: Promise<ScrapeResult> tells TypeScript and your IDE exactly
   * what properties will be available when this promise resolves
   */
  async scrapeUrl(url: string, config: CrawlerConfig = {}): Promise<ScrapeResult> {
    this.checkSetup();
    
    return new Promise<ScrapeResult>((resolve, reject) => {
      const args = [this.scriptPath, url];
      
      // Add config as JSON string if provided
      // Learning: Object.keys() is type-safe - TypeScript knows config is an object
      if (Object.keys(config).length > 0) {
        args.push(JSON.stringify(config));
      }

      this.log(`Starting crawl: ${url}`);
      const process = spawn(this.pythonPath, args);
      
      let stdout = '';
      let stderr = '';
      
      // Set up timeout with proper typing
      const timer = setTimeout(() => {
        process.kill('SIGTERM');
        reject(new Error(`Scraping timeout after ${this.timeout}ms`));
      }, this.timeout);

      // Type-safe event handlers
      // Learning: Buffer type annotation ensures we know exactly what 'data' contains
      process.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // Process exit handler with explicit typing
      process.on('close', (code: number | null) => {
        clearTimeout(timer);
        
        try {
          // Type assertion: we know this should parse to ScrapeResult
          // Learning: This is where runtime data meets compile-time types
          const result: ScrapeResult = JSON.parse(stdout);
          this.log(`Crawl completed: ${result.success ? 'SUCCESS' : 'FAILED'}`);
          resolve(result);
        } catch (e) {
          // If we can't parse JSON and process failed, provide error details
          if (code !== 0) {
            reject(new Error(`Python process failed (code ${code}): ${stderr}`));
          } else {
            // Type assertion for error handling
            // Learning: 'as Error' tells TypeScript we know this is an Error object
            const error = e as Error;
            reject(new Error(`Failed to parse result: ${error.message}\nOutput: ${stdout.substring(0, 500)}`));
          }
        }
      });

      // Error event handler with proper typing
      process.on('error', (error: Error) => {
        clearTimeout(timer);
        reject(new Error(`Failed to spawn Python process: ${error.message}`));
      });
    });
  }

  /**
   * Format the result for display
   * 
   * @param result Scrape result to format
   * @returns Formatted string ready for console output
   * 
   * Learning: TypeScript knows result.success, result.error, etc. exist
   * because of the ScrapeResult interface - no more guessing!
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
   * Save result to file if filename is provided
   * 
   * @param result Scrape result to save
   * @param filename Optional filename override
   * 
   * Learning: Parameter types ensure we can only pass valid data
   */
  async saveResult(result: ScrapeResult, filename?: string): Promise<void> {
    const targetFile = filename || this.outputFile;
    if (!targetFile) return;

    try {
      const content = result.success ? result.markdown : `Error: ${result.error}`;
      fs.writeFileSync(targetFile, content, 'utf8');
      console.error(`💾 Saved to: ${targetFile}`);
    } catch (error) {
      // Type assertion for error handling
      const err = error as Error;
      console.error(`❌ Failed to save file: ${err.message}`);
    }
  }
}