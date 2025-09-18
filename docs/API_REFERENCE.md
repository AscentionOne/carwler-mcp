# Web Crawler MCP - API Reference

## MCP Tools Reference

This document provides complete technical specifications for all 6 MCP tools provided by the Web Crawler server.

---

## Tool: `crawl-url`

**Description**: Scrape a single URL and return markdown content with smart caching.

### Input Schema
```json
{
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "format": "uri",
      "description": "URL to scrape (must be http:// or https://)"
    },
    "css_selector": {
      "type": "string",
      "description": "CSS selector to focus content extraction (optional)"
    },
    "timeout": {
      "type": "number",
      "description": "Timeout in seconds (default: 60)"
    }
  },
  "required": ["url"]
}
```

### Response Format
```json
{
  "content": [{
    "type": "text",
    "text": "✅ Successfully crawled: Page Title\n📄 URL: https://example.com\n📊 Status: 200\n📝 Content: 1234 characters\n💾 Cached for future use\n\n[Markdown content here]"
  }]
}
```

### Practical Examples

#### Basic URL Crawling
```javascript
// Claude Code usage
Use crawl-url to scrape https://docs.python.org/3/library/json.html
```

#### Advanced Options
```javascript
// With CSS selector for focused content
Use crawl-url to scrape https://fastapi.tiangolo.com/ focusing on the main content area using CSS selector ".main-content"
```

#### Different Strategies
```javascript
// Fast HTTP-only strategy for static content
Use crawl-url to scrape https://docs.python.org/3/library/json.html using HTTP strategy for faster processing
```

### MCP Protocol Call
```javascript
{
  "method": "tools/call",
  "params": {
    "name": "crawl-url",
    "arguments": {
      "url": "https://docs.python.org/3/library/json.html",
      "css_selector": ".body",
      "timeout": 30
    }
  }
}
```

---

## Tool: `crawl-docs`

**Description**: Batch crawl multiple URLs with optimization presets for efficient documentation gathering.

### Input Schema
```json
{
  "type": "object",
  "properties": {
    "urls": {
      "type": "array",
      "items": {"type": "string", "format": "uri"},
      "description": "Array of URLs to crawl",
      "maxItems": 10
    },
    "preset": {
      "type": "string",
      "enum": ["docs", "news", "api"],
      "description": "Configuration preset (docs: browser+careful, news: http+fast, api: http+balanced)"
    },
    "strategy": {
      "type": "string",
      "enum": ["browser", "http"],
      "description": "Crawling strategy override"
    },
    "max_sessions": {
      "type": "number",
      "minimum": 1,
      "maximum": 20,
      "description": "Max concurrent sessions"
    },
    "memory_threshold": {
      "type": "number",
      "minimum": 50,
      "maximum": 95,
      "description": "Memory threshold percentage"
    }
  },
  "required": ["urls"]
}
```

### Response Format
```json
{
  "content": [{
    "type": "text",
    "text": "📊 Batch Results (3 URLs):\n✅ Successful: 3/3\n❌ Failed: 0/3\n📈 Success Rate: 100.0%\n⏱️  Total Time: 12.5s\n🚀 Speed: 0.24 URLs/sec\n\n**Combined Content:**\n\n[All successful results combined]"
  }]
}
```

### Practical Examples

#### Documentation Site Crawling
```javascript
// Claude Code usage
Use crawl-docs to scrape the main FastAPI documentation sections:
- https://fastapi.tiangolo.com/tutorial/
- https://fastapi.tiangolo.com/advanced/
- https://fastapi.tiangolo.com/deployment/
```

#### Research Workflow
```javascript
// Batch crawl related documentation
Use crawl-docs to gather comprehensive information from these Python async resources:
- https://docs.python.org/3/library/asyncio.html
- https://docs.aiohttp.org/en/stable/
- https://fastapi.tiangolo.com/async/
```

#### News Aggregation
```javascript
// Using news preset for article extraction
Use crawl-docs with news preset to scrape these tech articles about AI developments
```

### MCP Protocol Call
```javascript
{
  "method": "tools/call",
  "params": {
    "name": "crawl-docs",
    "arguments": {
      "urls": [
        "https://fastapi.tiangolo.com/tutorial/",
        "https://fastapi.tiangolo.com/advanced/"
      ],
      "preset": "docs",
      "max_sessions": 5
    }
  }
}
```

---

## Tool: `get-cached`

**Description**: Retrieve previously crawled content from cache by URL.

### Input Schema
```json
{
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "format": "uri",
      "description": "URL to retrieve from cache"
    }
  },
  "required": ["url"]
}
```

### Response Format
```json
{
  "content": [{
    "type": "text",
    "text": "✅ Cached content: Page Title\n📄 URL: https://example.com\n📊 Cached: 2025-09-15T10:30:00Z\n📝 Content: 1234 characters\n🔄 Access count: 5\n🏷️ Tokens: 462\n\n[Cached markdown content]"
  }]
}
```

### Error Response
```json
{
  "content": [{
    "type": "text",
    "text": "❌ No cached content found for: https://example.com"
  }]
}
```

---

## Tool: `search-cache`

**Description**: Search cached content by text query with ranking by relevance and access frequency.

### Input Schema
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query (searches titles, URLs, and content)"
    },
    "limit": {
      "type": "number",
      "minimum": 1,
      "maximum": 20,
      "description": "Maximum results to return (default: 10)"
    }
  },
  "required": ["query"]
}
```

### Response Format
```json
{
  "content": [{
    "type": "text",
    "text": "🔍 Search Results (3 matches for \"authentication\"):\n\n**1. FastAPI Security Tutorial**\n   URL: https://fastapi.tiangolo.com/tutorial/security/\n   Cached: 2025-09-15T09:30:00Z\n   Tokens: 1248\n   Access count: 8\n\n**2. Django Authentication**\n   URL: https://docs.djangoproject.com/en/stable/topics/auth/\n   Cached: 2025-09-14T14:20:00Z\n   Tokens: 892\n   Access count: 3\n\n[Additional results...]"
  }]
}
```

---

## Tool: `list-cache`

**Description**: List all cached content with statistics and metadata.

### Input Schema
```json
{
  "type": "object",
  "properties": {
    "limit": {
      "type": "number",
      "minimum": 1,
      "maximum": 50,
      "description": "Maximum entries to list (default: 20)"
    }
  }
}
```

### Response Format
```json
{
  "content": [{
    "type": "text",
    "text": "📊 Cache Statistics:\n   Total entries: 15\n   Total size: 2.4 MB\n   Total tokens: 18,450\n   Most accessed: https://docs.python.org/3/library/asyncio.html\n   Oldest entry: 2025-09-10T08:15:00Z\n   Newest entry: 2025-09-15T11:30:00Z\n\n📋 Recent Entries (15 shown):\n\n**1. FastAPI Tutorial**\n   URL: https://fastapi.tiangolo.com/tutorial/\n   Cached: 2025-09-15T11:30:00Z\n   Tokens: 1,245 | Access count: 3\n\n[Additional entries...]"
  }]
}
```

### Empty Cache Response
```json
{
  "content": [{
    "type": "text",
    "text": "📭 Cache is empty"
  }]
}
```

---

## Tool: `clear-cache`

**Description**: Clear all cached crawled content.

### Input Schema
```json
{
  "type": "object",
  "properties": {}
}
```

### Response Format
```json
{
  "content": [{
    "type": "text",
    "text": "✅ Cache cleared successfully"
  }]
}
```

### Error Response
```json
{
  "content": [{
    "type": "text",
    "text": "❌ Failed to clear cache: [error message]"
  }]
}
```

---

## Configuration Presets

### `docs` Preset
```json
{
  "strategy": "browser",
  "memory_threshold": 70.0,
  "max_sessions": 5,
  "enable_rate_limiting": true,
  "base_delay": [1.0, 2.0],
  "max_delay": 30.0,
  "max_retries": 5
}
```
**Use for**: Technical documentation, complex sites with JavaScript

### `news` Preset
```json
{
  "strategy": "http",
  "memory_threshold": 80.0,
  "max_sessions": 10,
  "enable_rate_limiting": true,
  "base_delay": [0.5, 1.0],
  "max_delay": 15.0,
  "max_retries": 3
}
```
**Use for**: Blog posts, news articles, simple HTML content

### `api` Preset
```json
{
  "strategy": "http",
  "memory_threshold": 75.0,
  "max_sessions": 8,
  "enable_rate_limiting": true,
  "base_delay": [0.8, 1.5],
  "max_delay": 20.0,
  "max_retries": 4
}
```
**Use for**: API documentation, OpenAPI specs, structured docs

---

## Error Handling

### Common Error Responses

#### Invalid URL
```json
{
  "content": [{
    "type": "text",
    "text": "❌ Invalid URL: example.com. URLs must start with http:// or https://"
  }]
}
```

#### Timeout Error
```json
{
  "content": [{
    "type": "text",
    "text": "❌ Failed to crawl https://example.com: Scraping timeout after 60000ms"
  }]
}
```

#### Python Process Error
```json
{
  "content": [{
    "type": "text",
    "text": "❌ Crawler error: Python process failed (code 1): crawl4ai not found"
  }]
}
```

#### Batch Size Error
```json
{
  "content": [{
    "type": "text",
    "text": "❌ Maximum 10 URLs allowed per batch for performance"
  }]
}
```

---

## Cache File Format

### Cache Entry Structure
```json
{
  "url": "https://docs.python.org/3/library/json.html",
  "url_hash": "a1b2c3d4e5f6g7h8",
  "title": "json — JSON encoder and decoder",
  "markdown": "# json Module\n\nThe json module...",
  "status_code": 200,
  "content_length": 1847,
  "cached_at": "2025-09-15T10:30:00Z",
  "access_count": 5,
  "last_accessed": "2025-09-15T11:45:00Z",
  "token_count": 462
}
```

### Cache Statistics Format
```json
{
  "total_entries": 25,
  "total_size_mb": 3.8,
  "oldest_entry": "2025-09-10T08:15:00Z",
  "newest_entry": "2025-09-15T11:30:00Z",
  "most_accessed_url": "https://docs.python.org/3/library/asyncio.html",
  "total_tokens": 24680
}
```

---

## Performance Specifications

### Response Times
- **Single URL crawl**: 1-5 seconds (depending on complexity)
- **Batch crawl (5 URLs)**: 5-15 seconds (with presets)
- **Cache retrieval**: <100ms
- **Cache search**: 100-500ms (depending on cache size)
- **Cache listing**: 50-200ms

### Resource Limits
- **Maximum URLs per batch**: 10
- **Maximum cache entries**: 1000 (auto-cleanup)
- **Maximum tokens per response**: 2000 (auto-truncated)
- **Default timeout**: 60 seconds
- **Memory threshold**: 50-95% (configurable)

### Token Management
- Content automatically truncated to <2000 tokens
- Smart truncation preserves structure
- Truncation point indicated with continuation message
- Original content length preserved in metadata

---

## MCP Protocol Compliance

### Protocol Version
- **Supported**: MCP v2024-11-05
- **Transport**: StdioServerTransport
- **Message Format**: JSON-RPC 2.0

### Capabilities
```json
{
  "tools": {
    "listChanged": true
  }
}
```

### Server Information
```json
{
  "name": "web-crawler-mcp",
  "version": "1.0.0"
}
```

### Tool Registration
All 6 tools are registered with complete input schemas and descriptions, enabling Claude Code to automatically understand and use them effectively.