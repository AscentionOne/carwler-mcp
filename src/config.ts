/**
 * Configuration presets and utilities for v0.7.x Crawl4AI integration
 * 
 * This module provides optimized presets for different types of sites,
 * following the latest v0.7.x API patterns optimized for MCP server integration.
 * 
 * NOTE: Streaming mode has been removed from main CLI as it's not suitable for
 * MCP use cases where Claude needs complete information to formulate responses.
 */

import type { BatchCrawlOptions } from './types';

/**
 * Pre-configured crawling strategies for different site types
 * 
 * Each preset is optimized based on the typical characteristics:
 * - Documentation sites: Longer content, need careful parsing
 * - News sites: Fast loading, simple HTML structure
 * - API docs: Structured content, often static HTML
 */
export const CRAWL_PRESETS = {
  /**
   * Documentation Sites Preset
   * Optimized for comprehensive documentation crawling with browser rendering
   */
  docs: {
    strategy: 'browser' as const,
    memory_threshold: 80.0,        // Higher threshold for complex pages
    max_sessions: 8,               // Conservative for stability
    base_delay: [1.0, 2.0] as [number, number], // Respectful crawling
    max_delay: 30.0,
    max_retries: 5,
    enable_rate_limiting: true,
    headless: true,
    cache_mode: 'ENABLED' as const
  },
  
  /**
   * News Sites Preset  
   * Fast HTTP-only crawling for news and blog content
   */
  news: {
    strategy: 'http' as const,     // HTTP-only for speed
    memory_threshold: 70.0,        // Lower threshold for high throughput
    max_sessions: 15,              // More concurrent sessions
    max_connections: 25,           // HTTP strategy specific
    base_delay: [0.3, 0.8] as [number, number], // Faster crawling
    max_delay: 15.0,
    max_retries: 3,
    enable_rate_limiting: true,
    cache_mode: 'ENABLED' as const
  },
  
  /**
   * API Documentation Preset
   * Balanced approach for structured API documentation
   */
  api: {
    strategy: 'http' as const,     // Usually static HTML
    memory_threshold: 85.0,        // Higher threshold for batch processing
    max_sessions: 12,              
    max_connections: 20,
    base_delay: [0.5, 1.2] as [number, number], // Moderate speed
    max_delay: 25.0,
    max_retries: 4,
    enable_rate_limiting: true,
    headless: true,
    cache_mode: 'ENABLED' as const
  }
} as const;

/**
 * Type for available preset names
 */
export type PresetName = keyof typeof CRAWL_PRESETS;

/**
 * Get a preset configuration by name
 * 
 * @param presetName - Name of the preset to retrieve
 * @returns Batch crawl options for the specified preset
 * @throws Error if preset name is invalid
 */
export function getPreset(presetName: string): BatchCrawlOptions {
  const preset = CRAWL_PRESETS[presetName as PresetName];
  if (!preset) {
    const validPresets = Object.keys(CRAWL_PRESETS).join(', ');
    throw new Error(`Invalid preset '${presetName}'. Valid presets: ${validPresets}`);
  }
  
  return { ...preset }; // Return a copy to prevent mutation
}

/**
 * List all available preset names
 * 
 * @returns Array of available preset names
 */
export function listPresets(): PresetName[] {
  return Object.keys(CRAWL_PRESETS) as PresetName[];
}

/**
 * Get preset information for help display
 * 
 * @returns Object mapping preset names to descriptions
 */
export function getPresetDescriptions(): Record<PresetName, string> {
  return {
    docs: 'Documentation sites - Browser rendering, careful rate limiting',
    news: 'News/blog sites - Fast HTTP-only crawling, high throughput',
    api: 'API documentation - Balanced HTTP crawling for structured content'
  };
}

/**
 * Merge a preset with custom options
 * 
 * @param presetName - Base preset to start with
 * @param customOptions - Custom options to override preset values
 * @returns Merged configuration
 */
export function mergePresetWithOptions(
  presetName: string, 
  customOptions: Partial<BatchCrawlOptions>
): BatchCrawlOptions {
  const preset = getPreset(presetName);
  return { ...preset, ...customOptions };
}