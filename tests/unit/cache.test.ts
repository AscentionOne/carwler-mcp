/**
 * Cache Functionality Unit Tests
 * Tests for the cross-platform caching system
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { WebCrawlerCache } from '../../src/cache';
import { createTempDir, cleanupTempDir, createMockCacheEntry, MockFileSystem } from '../helpers/test-utils';

describe('WebCrawlerCache', () => {
  let tempDir: string;
  let cacheManager: WebCrawlerCache;

  beforeEach(() => {
    tempDir = createTempDir();
    // Initialize cache manager with test directory
    cacheManager = new WebCrawlerCache(tempDir);
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe('initialization', () => {
    it('should create cache directory if it does not exist', () => {
      const newTempDir = createTempDir();
      const cacheDir = path.join(newTempDir, 'cache');

      // Directory should not exist initially
      expect(fs.existsSync(cacheDir)).toBe(false);

      // Initialize cache manager
      new WebCrawlerCache(cacheDir);

      // Directory should now exist
      expect(fs.existsSync(cacheDir)).toBe(true);

      cleanupTempDir(newTempDir);
    });

    it('should handle existing cache directory', () => {
      // Create directory first
      fs.mkdirSync(tempDir, { recursive: true });

      // Should not throw error
      expect(() => new WebCrawlerCache(tempDir)).not.toThrow();
    });
  });

  describe('URL hashing', () => {
    it('should generate consistent hashes for same URL', () => {
      const url = 'https://example.com/test';
      const hash1 = cacheManager.generateUrlHash(url);
      const hash2 = cacheManager.generateUrlHash(url);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(16); // SHA256 truncated to 16 chars
    });

    it('should generate different hashes for different URLs', () => {
      const url1 = 'https://example.com/page1';
      const url2 = 'https://example.com/page2';

      const hash1 = cacheManager.generateUrlHash(url1);
      const hash2 = cacheManager.generateUrlHash(url2);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle special characters in URLs', () => {
      const url = 'https://example.com/page?param=value&special=!@#$%^&*()';

      expect(() => cacheManager.generateUrlHash(url)).not.toThrow();

      const hash = cacheManager.generateUrlHash(url);
      expect(hash).toBeTruthy();
      expect(hash).toHaveLength(16);
    });
  });

  describe('cache entry management', () => {
    const testUrl = 'https://example.com/test';
    const testEntry = createMockCacheEntry(testUrl, 'Test Page');

    it('should store cache entry successfully', async () => {
      await cacheManager.store(testUrl, testEntry);

      const filePath = path.join(tempDir, `${cacheManager.generateUrlHash(testUrl)}.json`);
      expect(fs.existsSync(filePath)).toBe(true);

      const stored = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(stored.url).toBe(testUrl);
      expect(stored.title).toBe('Test Page');
    });

    it('should retrieve cached entry', async () => {
      await cacheManager.store(testUrl, testEntry);

      const retrieved = await cacheManager.get(testUrl);

      expect(retrieved).toBeTruthy();
      expect(retrieved!.url).toBe(testUrl);
      expect(retrieved!.title).toBe('Test Page');
    });

    it('should return null for non-existent entry', async () => {
      const retrieved = await cacheManager.get('https://nonexistent.com');

      expect(retrieved).toBeNull();
    });

    it('should check if entry exists', async () => {
      expect(await cacheManager.exists(testUrl)).toBe(false);

      await cacheManager.store(testUrl, testEntry);

      expect(await cacheManager.exists(testUrl)).toBe(true);
    });

    it('should update access count and timestamp', async () => {
      await cacheManager.store(testUrl, testEntry);

      // Get entry (should update access info)
      const retrieved1 = await cacheManager.get(testUrl);
      expect(retrieved1!.access_count).toBe(2); // Original 1 + 1 from get

      // Get again
      const retrieved2 = await cacheManager.get(testUrl);
      expect(retrieved2!.access_count).toBe(3);

      // Last accessed should be updated
      expect(new Date(retrieved2!.last_accessed).getTime())
        .toBeGreaterThan(new Date(retrieved1!.last_accessed).getTime());
    });
  });

  describe('token optimization', () => {
    it('should truncate content to stay under token limit', async () => {
      const longContent = 'A'.repeat(10000); // Very long content
      const testEntry = {
        ...createMockCacheEntry('https://example.com/long'),
        markdown: longContent,
        token_count: 5000 // Over limit
      };

      await cacheManager.store('https://example.com/long', testEntry);
      const retrieved = await cacheManager.get('https://example.com/long');

      expect(retrieved!.token_count).toBeLessThanOrEqual(2000);
      expect(retrieved!.markdown.length).toBeLessThan(longContent.length);
    });

    it('should preserve content under token limit', async () => {
      const shortContent = 'Short content';
      const testEntry = {
        ...createMockCacheEntry('https://example.com/short'),
        markdown: shortContent,
        token_count: 50
      };

      await cacheManager.store('https://example.com/short', testEntry);
      const retrieved = await cacheManager.get('https://example.com/short');

      expect(retrieved!.markdown).toBe(shortContent);
      expect(retrieved!.token_count).toBe(50);
    });
  });

  describe('search functionality', () => {
    beforeEach(async () => {
      // Store multiple test entries
      await cacheManager.store('https://python.org/docs', createMockCacheEntry(
        'https://python.org/docs',
        'Python Documentation',
        '# Python Docs\nPython programming language documentation'
      ));

      await cacheManager.store('https://javascript.info', createMockCacheEntry(
        'https://javascript.info',
        'JavaScript Tutorial',
        '# JavaScript\nJavaScript programming tutorial'
      ));

      await cacheManager.store('https://example.com/api', createMockCacheEntry(
        'https://example.com/api',
        'API Reference',
        '# API\nRESTful API documentation'
      ));
    });

    it('should find entries by title search', async () => {
      const results = await cacheManager.search('Python');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Python Documentation');
    });

    it('should find entries by content search', async () => {
      const results = await cacheManager.search('programming');

      expect(results.length).toBeGreaterThanOrEqual(2); // Python and JavaScript
    });

    it('should return empty array for no matches', async () => {
      const results = await cacheManager.search('nonexistent');

      expect(results).toHaveLength(0);
    });

    it('should be case insensitive', async () => {
      const results = await cacheManager.search('PYTHON');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Python Documentation');
    });

    it('should limit search results', async () => {
      const results = await cacheManager.search('documentation', 1);

      expect(results).toHaveLength(1);
    });
  });

  describe('cache listing', () => {
    beforeEach(async () => {
      // Store test entries with different timestamps
      const now = new Date();

      await cacheManager.store('https://example.com/1', {
        ...createMockCacheEntry('https://example.com/1'),
        cached_at: new Date(now.getTime() - 86400000).toISOString() // 1 day ago
      });

      await cacheManager.store('https://example.com/2', {
        ...createMockCacheEntry('https://example.com/2'),
        cached_at: now.toISOString() // Now
      });
    });

    it('should list all cached entries', async () => {
      const entries = await cacheManager.listAll();

      expect(entries).toHaveLength(2);
      expect(entries.map(e => e.url)).toContain('https://example.com/1');
      expect(entries.map(e => e.url)).toContain('https://example.com/2');
    });

    it('should sort by date (newest first)', async () => {
      const entries = await cacheManager.listAll('date');

      expect(entries).toHaveLength(2);
      expect(entries[0].url).toBe('https://example.com/2'); // Newer
      expect(entries[1].url).toBe('https://example.com/1'); // Older
    });

    it('should filter by URL pattern', async () => {
      const entries = await cacheManager.listAll('date', 'example.com/1');

      expect(entries).toHaveLength(1);
      expect(entries[0].url).toBe('https://example.com/1');
    });

    it('should limit results', async () => {
      const entries = await cacheManager.listAll('date', undefined, 1);

      expect(entries).toHaveLength(1);
    });
  });

  describe('cache cleanup', () => {
    beforeEach(async () => {
      const now = new Date();

      // Old entry (over 30 days)
      await cacheManager.store('https://old.com', {
        ...createMockCacheEntry('https://old.com'),
        cached_at: new Date(now.getTime() - 40 * 86400000).toISOString()
      });

      // Recent entry
      await cacheManager.store('https://recent.com', {
        ...createMockCacheEntry('https://recent.com'),
        cached_at: now.toISOString()
      });
    });

    it('should clear all cache entries', async () => {
      const clearedCount = await cacheManager.clear();

      expect(clearedCount).toBe(2);

      const remaining = await cacheManager.listAll();
      expect(remaining).toHaveLength(0);
    });

    it('should clear entries by pattern', async () => {
      const clearedCount = await cacheManager.clear('old.com');

      expect(clearedCount).toBe(1);

      const remaining = await cacheManager.listAll();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].url).toBe('https://recent.com');
    });

    it('should clear entries older than specified days', async () => {
      const clearedCount = await cacheManager.clearOlderThan(30);

      expect(clearedCount).toBe(1);

      const remaining = await cacheManager.listAll();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].url).toBe('https://recent.com');
    });
  });

  describe('error handling', () => {
    it('should handle invalid JSON in cache file', async () => {
      const testUrl = 'https://example.com/invalid';
      const filePath = path.join(tempDir, `${cacheManager.generateUrlHash(testUrl)}.json`);

      // Write invalid JSON
      fs.writeFileSync(filePath, 'invalid json');

      const retrieved = await cacheManager.get(testUrl);
      expect(retrieved).toBeNull();
    });

    it('should handle file system errors gracefully', async () => {
      // Try to store in non-existent directory (should handle error)
      const badCacheManager = new CacheManager('/non/existent/path');

      await expect(badCacheManager.store('https://example.com', createMockCacheEntry('https://example.com')))
        .rejects.toThrow();
    });

    it('should handle permission errors', async () => {
      // This test might need to be skipped on some systems
      if (process.platform === 'win32') {
        return; // Skip on Windows
      }

      // Make directory read-only
      fs.chmodSync(tempDir, 0o444);

      await expect(cacheManager.store('https://example.com', createMockCacheEntry('https://example.com')))
        .rejects.toThrow();

      // Restore permissions for cleanup
      fs.chmodSync(tempDir, 0o755);
    });
  });

  describe('cross-platform compatibility', () => {
    it('should handle Windows-style paths', () => {
      const windowsPath = 'C:\\Users\\test\\.claude\\crawled_docs';
      expect(() => new CacheManager(windowsPath)).not.toThrow();
    });

    it('should handle Unix-style paths', () => {
      const unixPath = '/home/user/.claude/crawled_docs';
      expect(() => new CacheManager(unixPath)).not.toThrow();
    });

    it('should normalize path separators', () => {
      const mixedPath = 'C:/Users/test\\.claude/crawled_docs';
      expect(() => new CacheManager(mixedPath)).not.toThrow();
    });
  });
});

// Helper function to create mock cache entry with custom content
function createMockCacheEntry(url: string, title: string = 'Test Page', markdown: string = '# Test\nTest content'): any {
  return {
    url,
    url_hash: 'test-hash',
    title,
    markdown,
    status_code: 200,
    content_length: markdown.length,
    cached_at: new Date().toISOString(),
    access_count: 1,
    last_accessed: new Date().toISOString(),
    token_count: Math.floor(markdown.length / 4) // Rough token estimate
  };
}