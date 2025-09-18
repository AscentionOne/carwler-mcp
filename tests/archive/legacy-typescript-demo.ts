#!/usr/bin/env node

/**
 * TypeScript Test Suite for Web Crawler
 * 
 * Demonstrates type-safe testing patterns including:
 * - Union types for log levels
 * - Interface-based test result tracking
 * - Type-safe error handling
 * - Structured test configuration
 */

import type { ScrapeResult, LogLevel, TestResult } from './types';
import { SimpleCrawler } from './crawler';

/**
 * Type-safe test runner for the web crawler
 * 
 * Learning: Notice how TypeScript provides auto-completion for all
 * method parameters and prevents passing invalid log levels
 */
class CrawlerTester {
  private crawler: SimpleCrawler;
  private passed: number = 0;
  private failed: number = 0;

  constructor() {
    // Type-safe constructor call - IDE knows what options are available
    this.crawler = new SimpleCrawler({ verbose: true, timeout: 30000 });
  }

  /**
   * Type-safe logging with union type constraints
   * 
   * @param message Message to log
   * @param type Log level (auto-completed, typo-safe)
   * 
   * Learning: LogLevel union type prevents typos like 'sucess' or 'eror'
   */
  private log(message: string, type: LogLevel = 'info'): void {
    // Type-safe object with all LogLevel values
    // Learning: TypeScript ensures all union type cases are handled
    const prefix: Record<LogLevel, string> = {
      'info': '🧪',
      'success': '✅', 
      'error': '❌',
      'warn': '⚠️'
    };
    console.log(`${prefix[type]} ${message}`);
  }

  /**
   * Test a single URL with type-safe parameters
   * 
   * @param url URL to test
   * @param expectedSuccess Whether we expect success or failure
   * @param description Test description
   * 
   * Learning: All parameters are type-checked, preventing runtime errors
   */
  async testUrl(
    url: string, 
    expectedSuccess: boolean = true, 
    description: string = ''
  ): Promise<void> {
    const testName = description || url;
    this.log(`Testing: ${testName}`);
    
    try {
      // Type-safe method call - result is guaranteed to be ScrapeResult
      const result = await this.crawler.scrapeUrl(url);
      
      if (result.success === expectedSuccess) {
        this.log(`PASS: ${testName}`, 'success');
        
        // TypeScript knows these properties exist because of ScrapeResult interface
        if (result.success) {
          this.log(`  - Title: ${result.title || 'N/A'}`);
          this.log(`  - Status: ${result.status_code}`);
          this.log(`  - Content: ${result.content_length} chars`);
          this.log(`  - Preview: ${result.markdown.substring(0, 100).replace(/\n/g, ' ')}...`);
        }
        this.passed++;
      } else {
        this.log(`FAIL: ${testName} - Expected ${expectedSuccess ? 'success' : 'failure'} but got ${result.success ? 'success' : 'failure'}`, 'error');
        
        // Type-safe property access - TypeScript knows error can be string | null
        if (result.error) {
          this.log(`  - Error: ${result.error}`);
        }
        this.failed++;
      }
    } catch (error) {
      // Type assertion for error handling
      // Learning: TypeScript needs help knowing unknown values are Error objects
      const err = error as Error;
      this.log(`ERROR: ${testName} - ${err.message}`, 'error');
      this.failed++;
    }
    
    console.log(''); // Add spacing between tests
  }

  /**
   * Run the basic test suite
   * 
   * Learning: async/await with explicit return type
   */
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

  /**
   * Test configuration options
   */
  async testConfiguration(): Promise<void> {
    this.log('🔧 Testing Configuration Options\n');

    // Test with custom CSS selector - type-safe config object
    await this.testUrl(
      'https://httpbin.org/html',
      true,
      'Custom CSS selector test'
    );
  }

  /**
   * Display test summary with type-safe formatting
   * 
   * @returns Whether all tests passed
   * 
   * Learning: Explicit boolean return type makes intent clear
   */
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

  /**
   * Get structured test results
   * 
   * @returns Test result statistics
   * 
   * Learning: Return type annotation ensures consistent data structure
   */
  getResults(): TestResult {
    return {
      passed: this.passed,
      failed: this.failed,
      total: this.passed + this.failed
    };
  }
}

/**
 * Main test execution function
 * 
 * Learning: Explicit Promise<void> return type for async main functions
 */
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
    // Type-safe error handling
    const err = error as Error;
    console.error(`❌ Test suite failed: ${err.message}`);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}

// Export for potential reuse in other test files
export { CrawlerTester };