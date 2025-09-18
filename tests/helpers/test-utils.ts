/**
 * Test Utilities
 * Common helper functions for testing
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Create a temporary directory for testing
 */
export function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'crawler-test-'));
}

/**
 * Clean up temporary directory
 */
export function cleanupTempDir(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

/**
 * Create mock cache entry
 */
export function createMockCacheEntry(url: string, title: string = 'Test Page'): any {
  return {
    url,
    url_hash: generateUrlHash(url),
    title,
    markdown: `# ${title}\n\nTest content for ${url}`,
    status_code: 200,
    content_length: 100,
    cached_at: new Date().toISOString(),
    access_count: 1,
    last_accessed: new Date().toISOString(),
    token_count: 50
  };
}

/**
 * Generate URL hash (simplified for testing)
 */
export function generateUrlHash(url: string): string {
  // Simple hash for testing - not cryptographically secure
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Mock HTTP response
 */
export function createMockResponse(status: number = 200, body: string = '<html><body>Test</body></html>'): any {
  return {
    status_code: status,
    html: body,
    links: [],
    media: [],
    metadata: {
      title: 'Test Page',
      description: 'Test description'
    }
  };
}

/**
 * Delay function for async testing
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock file system operations
 */
export class MockFileSystem {
  private files: Map<string, string> = new Map();

  writeFile(filePath: string, content: string): void {
    this.files.set(filePath, content);
  }

  readFile(filePath: string): string | null {
    return this.files.get(filePath) || null;
  }

  exists(filePath: string): boolean {
    return this.files.has(filePath);
  }

  deleteFile(filePath: string): void {
    this.files.delete(filePath);
  }

  clear(): void {
    this.files.clear();
  }

  listFiles(): string[] {
    return Array.from(this.files.keys());
  }
}

/**
 * Assert error type and message
 */
export function expectError(fn: () => any, errorType: new (...args: any[]) => Error, message?: string): void {
  expect(fn).toThrow(errorType);
  if (message) {
    expect(fn).toThrow(message);
  }
}

/**
 * Wait for condition to be true
 */
export async function waitFor(condition: () => boolean, timeout: number = 5000): Promise<void> {
  const start = Date.now();
  while (!condition() && (Date.now() - start) < timeout) {
    await delay(100);
  }
  if (!condition()) {
    throw new Error(`Condition not met within ${timeout}ms`);
  }
}