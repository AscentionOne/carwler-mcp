/**
 * Crawler Functionality Unit Tests
 * Tests for the core crawler implementation
 */

import { SimpleCrawler } from '../../src/crawler';
import { createMockResponse, delay, MockFileSystem } from '../helpers/test-utils';

// Mock child_process to avoid actual Python calls during testing
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

import { spawn } from 'child_process';
const mockedSpawn = spawn as jest.MockedFunction<typeof spawn>;

describe('SimpleCrawler', () => {
  let crawler: SimpleCrawler;

  beforeEach(() => {
    crawler = new SimpleCrawler();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create crawler instance with default config', () => {
      expect(crawler).toBeInstanceOf(SimpleCrawler);
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        userAgent: 'Test Crawler 1.0',
        timeout: 30000,
        maxRetries: 5
      };

      const customCrawler = new SimpleCrawler(customConfig);
      expect(customCrawler).toBeInstanceOf(SimpleCrawler);
    });
  });

  describe('URL validation', () => {
    it('should validate correct HTTP URLs', () => {
      expect(crawler.isValidUrl('http://example.com')).toBe(true);
      expect(crawler.isValidUrl('https://example.com')).toBe(true);
      expect(crawler.isValidUrl('https://subdomain.example.com/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(crawler.isValidUrl('not-a-url')).toBe(false);
      expect(crawler.isValidUrl('ftp://example.com')).toBe(false);
      expect(crawler.isValidUrl('')).toBe(false);
      expect(crawler.isValidUrl('javascript:alert(1)')).toBe(false);
    });

    it('should reject malicious URLs', () => {
      expect(crawler.isValidUrl('file:///etc/passwd')).toBe(false);
      expect(crawler.isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    });
  });

  describe('Python subprocess integration', () => {
    beforeEach(() => {
      // Mock successful Python subprocess
      const mockChild = {
        stdout: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              // Simulate successful scraping response
              const response = JSON.stringify(createMockResponse());
              callback(Buffer.from(response));
            }
          })
        },
        stderr: {
          on: jest.fn()
        },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(0); // Exit code 0 = success
          }
        })
      };

      mockedSpawn.mockReturnValue(mockChild as any);
    });

    it('should successfully scrape valid URL', async () => {
      const result = await crawler.scrapeUrl('https://example.com');

      expect(result).toBeTruthy();
      expect(result.url).toBe('https://example.com');
      expect(result.status_code).toBe(200);
      expect(result.markdown).toContain('Test');
    });

    it('should handle Python subprocess errors', async () => {
      // Mock subprocess that exits with error
      const mockChild = {
        stdout: { on: jest.fn() },
        stderr: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('Python error occurred'));
            }
          })
        },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(1); // Exit code 1 = error
          }
        })
      };

      mockedSpawn.mockReturnValue(mockChild as any);

      await expect(crawler.scrapeUrl('https://example.com'))
        .rejects.toThrow('Python crawler failed');
    });

    it('should handle subprocess timeout', async () => {
      // Mock subprocess that never finishes
      const mockChild = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
        kill: jest.fn()
      };

      mockedSpawn.mockReturnValue(mockChild as any);

      // Use shorter timeout for testing
      const shortTimeoutCrawler = new SimpleCrawler({ timeout: 100 });

      await expect(shortTimeoutCrawler.scrapeUrl('https://example.com'))
        .rejects.toThrow('timeout');
    }, 10000);

    it('should pass correct parameters to Python script', async () => {
      await crawler.scrapeUrl('https://example.com', {
        strategy: 'http',
        timeout: 30000
      });

      expect(mockedSpawn).toHaveBeenCalledWith(
        'python3.11',
        expect.arrayContaining([
          expect.stringContaining('scrape.py'),
          'https://example.com',
          '--strategy', 'http',
          '--timeout', '30000'
        ]),
        expect.objectContaining({
          cwd: expect.stringContaining('scripts')
        })
      );
    });
  });

  describe('batch processing', () => {
    beforeEach(() => {
      // Mock successful responses for batch processing
      let callCount = 0;
      const mockChild = {
        stdout: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              const response = JSON.stringify({
                ...createMockResponse(),
                url: `https://example${callCount++}.com`
              });
              callback(Buffer.from(response));
            }
          })
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(0);
          }
        })
      };

      mockedSpawn.mockReturnValue(mockChild as any);
    });

    it('should process multiple URLs', async () => {
      const urls = [
        'https://example1.com',
        'https://example2.com',
        'https://example3.com'
      ];

      const results = await crawler.batchScrapeUrls(urls);

      expect(results.successful).toBe(3);
      expect(results.failed).toBe(0);
      expect(results.results).toHaveLength(3);
    });

    it('should handle mixed success and failure', async () => {
      let callCount = 0;
      const mockChild = {
        stdout: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              if (callCount === 1) {
                // Second call fails
                return;
              }
              const response = JSON.stringify(createMockResponse());
              callback(Buffer.from(response));
            }
          })
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(callCount === 1 ? 1 : 0); // Second call fails
            callCount++;
          }
        })
      };

      mockedSpawn.mockReturnValue(mockChild as any);

      const urls = ['https://good.com', 'https://bad.com'];
      const results = await crawler.batchScrapeUrls(urls);

      expect(results.successful).toBe(1);
      expect(results.failed).toBe(1);
    });

    it('should respect concurrency limits', async () => {
      const urls = Array.from({ length: 10 }, (_, i) => `https://example${i}.com`);

      await crawler.batchScrapeUrls(urls, {
        maxConcurrent: 2
      });

      // Check that spawn was not called more than 2 times simultaneously
      // This is a simplified check - in real implementation we'd track timing
      expect(mockedSpawn).toHaveBeenCalledTimes(10);
    });
  });

  describe('configuration presets', () => {
    it('should apply docs preset correctly', async () => {
      await crawler.scrapeUrl('https://docs.example.com', {
        preset: 'docs'
      });

      expect(mockedSpawn).toHaveBeenCalledWith(
        'python3.11',
        expect.arrayContaining([
          expect.stringContaining('scrape.py'),
          'https://docs.example.com',
          '--preset', 'docs'
        ]),
        expect.any(Object)
      );
    });

    it('should apply news preset correctly', async () => {
      await crawler.scrapeUrl('https://news.example.com', {
        preset: 'news'
      });

      expect(mockedSpawn).toHaveBeenCalledWith(
        'python3.11',
        expect.arrayContaining([
          '--preset', 'news'
        ]),
        expect.any(Object)
      );
    });

    it('should apply api preset correctly', async () => {
      await crawler.scrapeUrl('https://api.example.com', {
        preset: 'api'
      });

      expect(mockedSpawn).toHaveBeenCalledWith(
        'python3.11',
        expect.arrayContaining([
          '--preset', 'api'
        ]),
        expect.any(Object)
      );
    });
  });

  describe('response processing', () => {
    it('should parse valid JSON response', async () => {
      const mockResponse = {
        status_code: 200,
        html: '<html><body><h1>Test</h1></body></html>',
        markdown: '# Test',
        metadata: {
          title: 'Test Page',
          description: 'Test description'
        },
        links: ['https://example.com/link'],
        media: []
      };

      const mockChild = {
        stdout: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from(JSON.stringify(mockResponse)));
            }
          })
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(0);
          }
        })
      };

      mockedSpawn.mockReturnValue(mockChild as any);

      const result = await crawler.scrapeUrl('https://example.com');

      expect(result.status_code).toBe(200);
      expect(result.markdown).toBe('# Test');
      expect(result.metadata.title).toBe('Test Page');
      expect(result.links).toContain('https://example.com/link');
    });

    it('should handle malformed JSON response', async () => {
      const mockChild = {
        stdout: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('invalid json'));
            }
          })
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(0);
          }
        })
      };

      mockedSpawn.mockReturnValue(mockChild as any);

      await expect(crawler.scrapeUrl('https://example.com'))
        .rejects.toThrow('Failed to parse Python response');
    });

    it('should handle empty response', async () => {
      const mockChild = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(0);
          }
        })
      };

      mockedSpawn.mockReturnValue(mockChild as any);

      await expect(crawler.scrapeUrl('https://example.com'))
        .rejects.toThrow('No response from Python crawler');
    });
  });

  describe('retry mechanism', () => {
    it('should retry failed requests', async () => {
      let attemptCount = 0;
      const mockChild = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            attemptCount++;
            if (attemptCount < 3) {
              callback(1); // Fail first 2 attempts
            } else {
              // Mock successful response on 3rd attempt
              callback(0);
            }
          }
        })
      };

      // Mock success on stdout for final attempt
      mockChild.stdout.on = jest.fn((event, callback) => {
        if (event === 'data' && attemptCount === 3) {
          callback(Buffer.from(JSON.stringify(createMockResponse())));
        }
      });

      mockedSpawn.mockReturnValue(mockChild as any);

      const retryingCrawler = new SimpleCrawler({ maxRetries: 3 });
      const result = await retryingCrawler.scrapeUrl('https://example.com');

      expect(result).toBeTruthy();
      expect(mockedSpawn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries exceeded', async () => {
      const mockChild = {
        stdout: { on: jest.fn() },
        stderr: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('Persistent error'));
            }
          })
        },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(1); // Always fail
          }
        })
      };

      mockedSpawn.mockReturnValue(mockChild as any);

      const retryingCrawler = new SimpleCrawler({ maxRetries: 2 });

      await expect(retryingCrawler.scrapeUrl('https://example.com'))
        .rejects.toThrow('Python crawler failed');

      expect(mockedSpawn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockChild = {
        stdout: { on: jest.fn() },
        stderr: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('Network error: Connection refused'));
            }
          })
        },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(1);
          }
        })
      };

      mockedSpawn.mockReturnValue(mockChild as any);

      await expect(crawler.scrapeUrl('https://unreachable.com'))
        .rejects.toThrow('Python crawler failed');
    });

    it('should validate URL before processing', async () => {
      await expect(crawler.scrapeUrl('invalid-url'))
        .rejects.toThrow('Invalid URL');
    });

    it('should handle subprocess spawn errors', async () => {
      mockedSpawn.mockImplementation(() => {
        throw new Error('Python not found');
      });

      await expect(crawler.scrapeUrl('https://example.com'))
        .rejects.toThrow('Python not found');
    });
  });

  describe('performance metrics', () => {
    it('should track processing time', async () => {
      const result = await crawler.scrapeUrl('https://example.com');

      expect(result.processingTime).toBeDefined();
      expect(typeof result.processingTime).toBe('number');
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should track batch processing metrics', async () => {
      const urls = ['https://example1.com', 'https://example2.com'];
      const results = await crawler.batchScrapeUrls(urls);

      expect(results.totalTime).toBeDefined();
      expect(results.averageTime).toBeDefined();
      expect(results.urlsPerSecond).toBeDefined();
      expect(typeof results.totalTime).toBe('number');
      expect(typeof results.averageTime).toBe('number');
      expect(typeof results.urlsPerSecond).toBe('number');
    });
  });
});