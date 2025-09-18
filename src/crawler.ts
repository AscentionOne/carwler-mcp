import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import type { ScrapeResult, CrawlerOptions, CrawlerConfig, BatchCrawlOptions, BatchScrapeResult } from './types';

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

  /**
   * Batch scrape multiple URLs using v0.7.x native features
   * 
   * Integrates with the native --native-batch-crawl functionality implemented
   * in scrape.py, leveraging all v0.7.x features like MemoryAdaptiveDispatcher,
   * RateLimiter, and AsyncHTTPCrawlerStrategy.
   * 
   * @param urls Array of URLs to scrape
   * @param options v0.7.x batch crawling configuration options
   * @returns Promise resolving to batch scrape results with performance metrics
   */
  async batchScrapeUrls(urls: string[], options: BatchCrawlOptions = {}): Promise<BatchScrapeResult> {
    this.checkSetup();
    
    if (!urls || urls.length === 0) {
      throw new Error('URLs array cannot be empty');
    }

    // Validate URLs
    for (const url of urls) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error(`Invalid URL: ${url}. URLs must start with http:// or https://`);
      }
    }

    return new Promise<BatchScrapeResult>((resolve, reject) => {
      const startTime = Date.now();
      
      // Prepare native v0.7.x configuration
      const nativeConfig = {
        // Cache configuration
        cache_mode: options.cache_mode || 'ENABLED',
        
        // Session management
        session_id: options.session_id || `batch_${Date.now()}`,
        
        // Memory management (v0.7.x MemoryAdaptiveDispatcher)
        memory_threshold: options.memory_threshold || 70.0,
        check_interval: options.check_interval || 1.0,
        max_sessions: options.max_sessions || 10,
        memory_wait_timeout: options.memory_wait_timeout || 300.0,
        
        // Rate limiting (v0.7.x RateLimiter)
        enable_rate_limiting: options.enable_rate_limiting !== false,
        base_delay: options.base_delay || [0.5, 1.5],
        max_delay: options.max_delay || 30.0,
        max_retries: options.max_retries || 5,
        
        // Monitoring (v0.7.x CrawlerMonitor with DisplayMode)
        max_visible_rows: options.max_visible_rows || 15,
        
        // Crawler strategy
        strategy: options.strategy || 'browser',
        max_connections: options.max_connections || 20,
        
        // Browser configuration
        headless: options.headless !== false,
        persistent_browser: options.persistent_browser || false,
        user_data_dir: options.user_data_dir || null
      };

      // Use --native-batch-crawl mode with v0.7.x features
      const args = [
        this.scriptPath,
        '--native-batch-crawl',
        '--urls', JSON.stringify(urls),
        '--config', JSON.stringify(nativeConfig)
      ];

      this.log(`Starting v0.7.x batch crawl: ${urls.length} URLs with ${nativeConfig.strategy} strategy`);
      const process = spawn(this.pythonPath, args);
      
      let stdout = '';
      let stderr = '';
      
      // Set up timeout
      const timer = setTimeout(() => {
        process.kill('SIGTERM');
        reject(new Error(`Batch crawling timeout after ${this.timeout}ms`));
      }, this.timeout);

      process.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      process.on('close', (code: number | null) => {
        clearTimeout(timer);
        const endTime = Date.now();
        
        try {
          // Parse the batch results from Python
          const pythonResults: ScrapeResult[] = JSON.parse(stdout);
          
          // Calculate batch metrics
          const successful = pythonResults.filter(r => r.success);
          const failed = pythonResults.filter(r => !r.success);
          
          const batchResult: BatchScrapeResult = {
            results: pythonResults,
            success_rate: successful.length / pythonResults.length,
            total_time: endTime - startTime,
            successful_count: successful.length,
            failed_count: failed.length,
            performance_metrics: {
              avg_response_time_ms: (endTime - startTime) / pythonResults.length,
              concurrent_sessions_used: Math.min(nativeConfig.max_sessions, urls.length)
            }
          };
          
          this.log(`Batch crawl completed: ${successful.length}/${urls.length} successful (${(batchResult.success_rate * 100).toFixed(1)}%)`);
          resolve(batchResult);
          
        } catch (e) {
          if (code !== 0) {
            reject(new Error(`Python batch process failed (code ${code}): ${stderr}`));
          } else {
            const error = e as Error;
            reject(new Error(`Failed to parse batch results: ${error.message}\nOutput: ${stdout.substring(0, 500)}`));
          }
        }
      });

      process.on('error', (error: Error) => {
        clearTimeout(timer);
        reject(new Error(`Failed to spawn Python batch process: ${error.message}`));
      });
    });
  }

  /**
   * Convenience method for HTTP-only batch crawling
   * Uses AsyncHTTPCrawlerStrategy for maximum performance with simple sites
   */
  async batchScrapeUrlsHTTP(urls: string[], options: Omit<BatchCrawlOptions, 'strategy'> = {}): Promise<BatchScrapeResult> {
    return this.batchScrapeUrls(urls, { ...options, strategy: 'http' });
  }

}