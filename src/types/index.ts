/**
 * Type definitions for the Web Crawler project
 * 
 * These interfaces define the contracts between different layers:
 * - Python subprocess communication
 * - Node.js crawler configuration  
 * - Test framework structures
 */

/**
 * Result returned by the Python scraping process
 * 
 * This interface defines the exact contract between the Python script
 * and Node.js. The Python script MUST return JSON matching this shape.
 * 
 * Learning: This demonstrates how TypeScript interfaces can document
 * cross-language communication protocols.
 */
export interface ScrapeResult {
  /** Whether the scraping operation succeeded */
  success: boolean;
  
  /** Clean markdown content (only present if success=true) */
  markdown: string;
  
  /** The final URL after any redirects */
  url: string;
  
  /** HTTP status code from the request */
  status_code: number;
  
  /** Page title extracted from the HTML */
  title: string;
  
  /** Length of the markdown content in characters */
  content_length: number;
  
  /** Error message (only present if success=false) */
  error: string | null;
}

/**
 * Configuration options for the SimpleCrawler constructor
 * 
 * These control Node.js behavior and Python subprocess management.
 * All properties are optional with sensible defaults.
 * 
 * Learning: Optional properties (?) allow flexible configuration
 * while TypeScript ensures only valid options are passed.
 */
export interface CrawlerOptions {
  /** Path to Python executable (default: 'python3.11') */
  pythonPath?: string;
  
  /** Timeout for scraping operations in milliseconds (default: 60000) */
  timeout?: number;
  
  /** File to save output to, or null for no file output (default: null) */
  outputFile?: string | null;
  
  /** Enable verbose logging (default: false) */
  verbose?: boolean;
}

/**
 * Configuration passed to the Python scraping script
 * 
 * These options control crawl4ai behavior and are passed as JSON
 * to the Python subprocess.
 * 
 * Learning: Separating Node.js config from Python config provides
 * clear separation of concerns between the layers.
 */
export interface CrawlerConfig {
  /** CSS selector to focus content extraction */
  css_selector?: string;
  
  /** HTML tags to exclude from extraction */
  excluded_tags?: string[];
  
  /** Minimum word count threshold for content blocks */
  word_count_threshold?: number;
  
  /** Page timeout in milliseconds for the browser */
  page_timeout?: number;
}

/**
 * Log levels for type-safe logging
 * 
 * Using union types instead of magic strings prevents typos
 * and provides auto-completion in IDEs.
 * 
 * Learning: Union types create "enums" that are both type-safe
 * and provide excellent IDE support.
 */
export type LogLevel = 'info' | 'success' | 'error' | 'warn';

/**
 * Test result tracking interface
 * 
 * Provides programmatic access to test statistics for
 * both display and decision-making purposes.
 */
export interface TestResult {
  /** Number of tests that passed */
  passed: number;
  
  /** Number of tests that failed */
  failed: number;
  
  /** Total number of tests run */
  total: number;
}

/**
 * Type guard function signature for runtime type checking
 * 
 * Learning: Type guards help bridge the gap between runtime
 * and compile-time type safety.
 */
export type TypeGuard<T> = (value: unknown) => value is T;

/**
 * Utility type for making all properties of an interface required
 * 
 * Learning: TypeScript utility types provide powerful ways to
 * transform existing types.
 */
export type Required<T> = {
  [P in keyof T]-?: T[P];
};

/**
 * Promise-based function signature for async operations
 * 
 * Learning: Generic types allow us to specify what type of data
 * an async operation will resolve to.
 */
export type AsyncFunction<T> = () => Promise<T>;

/**
 * Configuration validation result
 * 
 * Used for type-safe validation of user-provided configuration
 */
export interface ValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  
  /** Error messages if validation failed */
  errors: string[];
}