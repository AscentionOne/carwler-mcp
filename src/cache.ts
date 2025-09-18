import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { ScrapeResult } from './types/index.js';

/**
 * Cross-Platform Caching System for MCP Web Crawler
 *
 * Provides intelligent caching with token management for Claude Code integration.
 * Features:
 * - Cross-platform storage (~/.claude/crawled_docs/)
 * - Token-efficient responses (<2000 tokens)
 * - Content deduplication by URL hash
 * - Automatic cache cleanup and management
 * - Full-text search capabilities
 */

export interface CacheEntry {
  url: string;
  url_hash: string;
  title: string;
  markdown: string;
  status_code: number;
  content_length: number;
  cached_at: string;
  access_count: number;
  last_accessed: string;
  token_count: number;
}

export interface CacheStats {
  total_entries: number;
  total_size_mb: number;
  oldest_entry: string;
  newest_entry: string;
  most_accessed_url: string;
  total_tokens: number;
}

export class WebCrawlerCache {
  private readonly cacheDir: string;
  private readonly maxTokensPerEntry: number = 2000;
  private readonly maxCacheEntries: number = 1000;

  constructor() {
    this.cacheDir = this.getCacheDirectory();
    this.ensureCacheDirectory();
  }

  /**
   * Get cross-platform cache directory
   */
  private getCacheDirectory(): string {
    const os = process.platform;
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';

    if (os === 'win32') {
      return path.join(process.env.USERPROFILE || 'C:\\Users\\Default', '.claude', 'crawled_docs');
    } else {
      return path.join(homeDir, '.claude', 'crawled_docs');
    }
  }

  /**
   * Ensure cache directory exists
   */
  private ensureCacheDirectory(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Generate URL hash for consistent caching
   */
  private generateUrlHash(url: string): string {
    return crypto.createHash('sha256').update(url).digest('hex').substring(0, 16);
  }

  /**
   * Estimate token count (rough approximation: 1 token ≈ 4 characters)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Truncate content to fit token limit while preserving structure
   */
  private truncateForTokens(markdown: string, maxTokens: number): string {
    const maxChars = maxTokens * 4; // Rough token-to-char conversion

    if (markdown.length <= maxChars) {
      return markdown;
    }

    // Try to find a good truncation point (end of paragraph or section)
    const truncated = markdown.substring(0, maxChars);
    const lastParagraph = truncated.lastIndexOf('\n\n');
    const lastSection = truncated.lastIndexOf('\n#');

    const cutPoint = Math.max(lastParagraph, lastSection);

    if (cutPoint > maxChars * 0.8) { // If we can preserve at least 80% of content structure
      return truncated.substring(0, cutPoint) + '\n\n[Content truncated for token efficiency...]';
    }

    return truncated + '\n\n[Content truncated for token efficiency...]';
  }

  /**
   * Cache a scrape result
   */
  async cacheResult(result: ScrapeResult): Promise<void> {
    if (!result.success || !result.markdown) {
      return;
    }

    try {
      const urlHash = this.generateUrlHash(result.url);
      const cacheFile = path.join(this.cacheDir, `${urlHash}.json`);

      // Truncate content for token efficiency
      const truncatedMarkdown = this.truncateForTokens(result.markdown, this.maxTokensPerEntry);

      const cacheEntry: CacheEntry = {
        url: result.url,
        url_hash: urlHash,
        title: result.title,
        markdown: truncatedMarkdown,
        status_code: result.status_code,
        content_length: truncatedMarkdown.length,
        cached_at: new Date().toISOString(),
        access_count: 0,
        last_accessed: new Date().toISOString(),
        token_count: this.estimateTokens(truncatedMarkdown)
      };

      fs.writeFileSync(cacheFile, JSON.stringify(cacheEntry, null, 2), 'utf8');

      // Cleanup old entries if we exceed the limit
      await this.cleanupOldEntries();
    } catch (error) {
      console.error(`Failed to cache result for ${result.url}:`, error);
    }
  }

  /**
   * Get cached result by URL
   */
  async getCachedResult(url: string): Promise<CacheEntry | null> {
    try {
      const urlHash = this.generateUrlHash(url);
      const cacheFile = path.join(this.cacheDir, `${urlHash}.json`);

      if (!fs.existsSync(cacheFile)) {
        return null;
      }

      const cached: CacheEntry = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));

      // Update access tracking
      cached.access_count++;
      cached.last_accessed = new Date().toISOString();
      fs.writeFileSync(cacheFile, JSON.stringify(cached, null, 2), 'utf8');

      return cached;
    } catch (error) {
      console.error(`Failed to read cache for ${url}:`, error);
      return null;
    }
  }

  /**
   * Search cached content by text
   */
  async searchCache(query: string, limit: number = 10): Promise<CacheEntry[]> {
    try {
      const files = fs.readdirSync(this.cacheDir);
      const cacheFiles = files.filter(f => f.endsWith('.json'));
      const results: CacheEntry[] = [];

      const searchRegex = new RegExp(query, 'i');

      for (const file of cacheFiles) {
        try {
          const cached: CacheEntry = JSON.parse(
            fs.readFileSync(path.join(this.cacheDir, file), 'utf8')
          );

          // Search in title, URL, and content
          if (
            searchRegex.test(cached.title) ||
            searchRegex.test(cached.url) ||
            searchRegex.test(cached.markdown)
          ) {
            results.push(cached);

            if (results.length >= limit) {
              break;
            }
          }
        } catch {
          // Skip corrupted cache files
          continue;
        }
      }

      // Sort by access count and recency
      return results.sort((a, b) => {
        const scoreA = a.access_count + (new Date(a.last_accessed).getTime() / 1000000);
        const scoreB = b.access_count + (new Date(b.last_accessed).getTime() / 1000000);
        return scoreB - scoreA;
      });
    } catch (error) {
      console.error(`Failed to search cache:`, error);
      return [];
    }
  }

  /**
   * List all cached entries
   */
  async listCache(limit: number = 50): Promise<CacheEntry[]> {
    try {
      const files = fs.readdirSync(this.cacheDir);
      const cacheFiles = files.filter(f => f.endsWith('.json'));
      const entries: CacheEntry[] = [];

      for (const file of cacheFiles.slice(0, limit)) {
        try {
          const cached: CacheEntry = JSON.parse(
            fs.readFileSync(path.join(this.cacheDir, file), 'utf8')
          );
          entries.push(cached);
        } catch {
          // Skip corrupted cache files
          continue;
        }
      }

      // Sort by last accessed (most recent first)
      return entries.sort((a, b) =>
        new Date(b.last_accessed).getTime() - new Date(a.last_accessed).getTime()
      );
    } catch (error) {
      console.error(`Failed to list cache:`, error);
      return [];
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const entries = await this.listCache(this.maxCacheEntries);

      if (entries.length === 0) {
        return {
          total_entries: 0,
          total_size_mb: 0,
          oldest_entry: 'N/A',
          newest_entry: 'N/A',
          most_accessed_url: 'N/A',
          total_tokens: 0
        };
      }

      const totalSizeBytes = entries.reduce((sum, entry) => sum + entry.content_length, 0);
      const totalTokens = entries.reduce((sum, entry) => sum + entry.token_count, 0);

      const sortedByDate = [...entries].sort((a, b) =>
        new Date(a.cached_at).getTime() - new Date(b.cached_at).getTime()
      );

      const mostAccessed = [...entries].sort((a, b) => b.access_count - a.access_count)[0];

      return {
        total_entries: entries.length,
        total_size_mb: Number((totalSizeBytes / (1024 * 1024)).toFixed(2)),
        oldest_entry: sortedByDate[0]?.cached_at || 'N/A',
        newest_entry: sortedByDate[sortedByDate.length - 1]?.cached_at || 'N/A',
        most_accessed_url: mostAccessed?.url || 'N/A',
        total_tokens: totalTokens
      };
    } catch (error) {
      console.error(`Failed to get cache stats:`, error);
      return {
        total_entries: 0,
        total_size_mb: 0,
        oldest_entry: 'Error',
        newest_entry: 'Error',
        most_accessed_url: 'Error',
        total_tokens: 0
      };
    }
  }

  /**
   * Clean up old cache entries to stay within limits
   */
  private async cleanupOldEntries(): Promise<void> {
    try {
      const entries = await this.listCache(this.maxCacheEntries + 100);

      if (entries.length <= this.maxCacheEntries) {
        return;
      }

      // Sort by access count and age (least accessed and oldest first)
      const sortedForCleanup = entries.sort((a, b) => {
        const scoreA = a.access_count + (new Date(a.last_accessed).getTime() / 1000000);
        const scoreB = b.access_count + (new Date(b.last_accessed).getTime() / 1000000);
        return scoreA - scoreB;
      });

      // Remove excess entries
      const toRemove = sortedForCleanup.slice(0, entries.length - this.maxCacheEntries);

      for (const entry of toRemove) {
        const cacheFile = path.join(this.cacheDir, `${entry.url_hash}.json`);
        try {
          fs.unlinkSync(cacheFile);
        } catch {
          // Ignore errors when removing files
        }
      }
    } catch (error) {
      console.error(`Failed to cleanup cache:`, error);
    }
  }

  /**
   * Clear entire cache
   */
  async clearCache(): Promise<void> {
    try {
      if (fs.existsSync(this.cacheDir)) {
        fs.rmSync(this.cacheDir, { recursive: true, force: true });
        this.ensureCacheDirectory();
      }
    } catch (error) {
      console.error(`Failed to clear cache:`, error);
      throw error;
    }
  }

  /**
   * Update cache entry (for modifying content or metadata)
   */
  async updateCacheEntry(urlHash: string, updates: Partial<CacheEntry>): Promise<boolean> {
    try {
      const cacheFile = path.join(this.cacheDir, `${urlHash}.json`);

      if (!fs.existsSync(cacheFile)) {
        return false;
      }

      const existing: CacheEntry = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      const updated = { ...existing, ...updates };

      // Recalculate token count if content changed
      if (updates.markdown) {
        updated.token_count = this.estimateTokens(updates.markdown);
        updated.content_length = updates.markdown.length;
      }

      fs.writeFileSync(cacheFile, JSON.stringify(updated, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`Failed to update cache entry ${urlHash}:`, error);
      return false;
    }
  }
}