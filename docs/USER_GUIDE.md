# Web Crawler MCP - Complete User Guide

## Overview

The Web Crawler MCP is a Model Context Protocol server that provides Claude Code with powerful web scraping capabilities. It converts web pages into clean, Claude-friendly markdown while maintaining intelligent caching for optimal performance.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Installation & Setup](#installation--setup)
3. [Available Tools](#available-tools)
4. [Usage Examples](#usage-examples)
5. [Configuration Options](#configuration-options)
6. [Caching System](#caching-system)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### 🚀 5-Minute Setup

#### 1. Prerequisites Check
```bash
python3.11 --version  # Should show 3.11+
pip list | grep crawl4ai  # Should show crawl4ai
node --version  # Should show 14+
```

#### 2. Install Globally
```bash
cd /home/kenchen/projects/crawler
npm install -g ./web-crawler-mcp-1.0.0.tgz
which web-crawler-mcp  # Verify installation
```

#### 3. Configure Claude Code
Add to MCP settings:
```json
{
  "mcpServers": {
    "web-crawler": {
      "command": "web-crawler-mcp",
      "args": []
    }
  }
}
```

#### 4. Test It!
In Claude Code, try:
```
Crawl https://docs.python.org/3/library/json.html and summarize it
```

### 📚 Essential Examples

#### Single Page
```
Get the React hooks documentation from https://react.dev/reference/react
```

#### Multiple Pages
```
Crawl these FastAPI tutorials with the "docs" preset:
- https://fastapi.tiangolo.com/tutorial/first-steps/
- https://fastapi.tiangolo.com/tutorial/path-params/
```

#### Search Cache
```
Search my cached docs for "authentication examples"
```

#### List Cache
```
Show me what documentation I have cached
```

### ⚙️ Configuration Presets

| Preset | Use For | Speed | Quality |
|--------|---------|-------|---------|
| `docs` | Documentation, tutorials | Medium | High |
| `news` | Blog posts, articles | Fast | Good |
| `api` | API documentation | Fast | High |

### 🗂️ Cache Location

All crawled content saved to:
- **Linux**: `~/.claude/crawled_docs/`
- **Windows**: `C:\Users\{user}\.claude\crawled_docs\`

### 🛠️ Quick Troubleshooting

**MCP not working?**
```bash
# Check installation
which web-crawler-mcp

# Test server
timeout 3 web-crawler-mcp
```

**Python errors?**
```bash
pip install --upgrade crawl4ai
crawl4ai-setup
```

### 🎯 Pro Tips

1. **Start simple**: Single URLs first, then batch crawling
2. **Use presets**: `docs` for documentation, `news` for articles
3. **Leverage cache**: Search before crawling new content
4. **Natural language**: Just ask Claude to crawl - no special syntax needed

**Ready to crawl! 🕷️**

---

## Installation & Setup

### Prerequisites

```bash
# Required: Python 3.11+ with crawl4ai
python3.11 --version
pip install crawl4ai
crawl4ai-setup

# Required: Node.js 14+
node --version
```

### Global Installation

```bash
# Clone or navigate to the project
cd /home/kenchen/projects/crawler

# Install globally (stays private to your machine)
npm pack
npm install -g ./web-crawler-mcp-1.0.0.tgz

# Verify installation
which web-crawler-mcp
# Should show: /home/kenchen/.npm-global/bin/web-crawler-mcp
```

### Claude Code Configuration

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "web-crawler": {
      "command": "web-crawler-mcp",
      "args": [],
      "env": {}
    }
  }
}
```

---

## Available Tools

The MCP server provides 6 powerful tools for web crawling and cache management:

### 1. `crawl-url` - Single URL Scraping

**Purpose**: Scrape a single web page and return clean markdown content.

**Parameters**:
- `url` (required): HTTP/HTTPS URL to scrape
- `css_selector` (optional): CSS selector to focus content extraction
- `timeout` (optional): Timeout in seconds (default: 60)

**Returns**: Clean markdown content with metadata

---

### 2. `crawl-docs` - Batch URL Processing

**Purpose**: Efficiently crawl multiple URLs with optimization presets.

**Parameters**:
- `urls` (required): Array of URLs to crawl (max 10 for performance)
- `preset` (optional): Configuration preset (`docs`, `news`, `api`)
- `strategy` (optional): Crawling strategy (`browser`, `http`)
- `max_sessions` (optional): Max concurrent sessions (1-20)
- `memory_threshold` (optional): Memory threshold percentage (50-95)

**Returns**: Combined results from all URLs with performance metrics

---

### 3. `get-cached` - Retrieve Cached Content

**Purpose**: Quickly retrieve previously crawled content from cache.

**Parameters**:
- `url` (required): URL to retrieve from cache

**Returns**: Cached content with access statistics

---

### 4. `search-cache` - Full-Text Cache Search

**Purpose**: Search across all cached content by text query.

**Parameters**:
- `query` (required): Search terms (searches titles, URLs, and content)
- `limit` (optional): Maximum results to return (default: 10, max: 20)

**Returns**: Ranked search results from cache

---

### 5. `list-cache` - Browse Cache Contents

**Purpose**: List all cached content with statistics and metadata.

**Parameters**:
- `limit` (optional): Maximum entries to list (default: 20, max: 50)

**Returns**: Cache listing with statistics (size, tokens, access counts)

---

### 6. `clear-cache` - Cache Management

**Purpose**: Clear all cached crawled content.

**Parameters**: None

**Returns**: Confirmation of cache clearing

---

## Usage Examples

### Single Page Crawling

#### Basic Usage
```
Crawl https://docs.python.org/3/library/json.html and summarize the main functions.
```

**What happens**:
1. Claude uses `crawl-url` tool
2. Page is scraped and converted to markdown
3. Content is cached for future use
4. Summary is provided based on scraped content

#### With CSS Selector
```
Crawl https://react.dev/learn/state-a-components-memory but focus only on the code examples.
```

**Advanced prompt**:
```
Use crawl-url to get https://fastapi.tiangolo.com/tutorial/first-steps/ with css_selector=".highlight" to extract only code blocks, then explain the FastAPI setup process.
```

### Batch Documentation Crawling

#### Using Presets
```
Use crawl-docs to get comprehensive FastAPI documentation from:
- https://fastapi.tiangolo.com/tutorial/
- https://fastapi.tiangolo.com/advanced/
- https://fastapi.tiangolo.com/tutorial/security/

Use the "docs" preset for careful, high-quality crawling.
```

#### News/Blog Content
```
Get the latest articles from:
- https://blog.python.org/2024/01/python-312-released.html
- https://realpython.com/python-news-january-2024/
- https://planetpython.org/

Use the "news" preset for fast HTTP-based crawling.
```

#### API Documentation
```
Crawl these API documentation pages using the "api" preset:
- https://docs.github.com/en/rest/authentication
- https://developer.twitter.com/en/docs/authentication
- https://developers.google.com/identity/protocols/oauth2

Focus on authentication methods across different APIs.
```

### Cache Operations

#### Search Cached Content
```
Search the cache for "authentication" and show me all relevant documentation I've previously crawled.
```

```
Find all cached content about "React hooks" and create a comprehensive guide.
```

#### Browse Cache
```
Show me what documentation I have cached, focusing on the most recently accessed items.
```

#### Retrieve Specific Cached Content
```
Get the cached content for https://docs.python.org/3/library/asyncio.html - I know I crawled it before.
```

#### Cache Management
```
Clear my documentation cache - I want to start fresh.
```

### Advanced Usage Patterns

#### Smart Documentation Workflow
```
I'm learning Django. First, check what Django documentation I have cached. If I don't have the authentication tutorial, crawl these pages with the "docs" preset:
- https://docs.djangoproject.com/en/stable/topics/auth/
- https://docs.djangoproject.com/en/stable/topics/auth/default/
- https://docs.djangoproject.com/en/stable/topics/auth/customizing/

Then provide a comprehensive guide to Django authentication.
```

#### Research Workflow
```
I need to compare authentication methods. Search my cache for "OAuth" and "JWT". If the results are insufficient, crawl:
- https://oauth.net/2/
- https://jwt.io/introduction/
- https://auth0.com/learn/json-web-tokens/

Use the "api" preset and then create a comparison table.
```

#### Performance-Optimized Crawling
```
Crawl these 5 React documentation pages using these optimizations:
- Strategy: "http" (for speed)
- Max sessions: 8 (for concurrency)
- Memory threshold: 80 (for resource management)

URLs:
- https://react.dev/learn/describing-the-ui
- https://react.dev/learn/adding-interactivity
- https://react.dev/learn/managing-state
- https://react.dev/learn/escape-hatches
- https://react.dev/learn/you-might-not-need-an-effect
```

---

## Configuration Options

### Crawling Strategies

| Strategy | Use Case | Speed | Quality | Memory |
|----------|----------|-------|---------|--------|
| `browser` | Complex sites, SPAs, JavaScript-heavy | Slower | High | Higher |
| `http` | Simple HTML, blogs, documentation | Faster | Good | Lower |

### Configuration Presets

#### `docs` Preset - Documentation Sites
```json
{
  "strategy": "browser",
  "memory_threshold": 70.0,
  "max_sessions": 5,
  "enable_rate_limiting": true,
  "base_delay": [1.0, 2.0]
}
```
**Use for**: Technical documentation, API docs, tutorial sites

#### `news` Preset - News/Blog Content
```json
{
  "strategy": "http",
  "memory_threshold": 80.0,
  "max_sessions": 10,
  "enable_rate_limiting": true,
  "base_delay": [0.5, 1.0]
}
```
**Use for**: Blog posts, news articles, simple content sites

#### `api` Preset - API Documentation
```json
{
  "strategy": "http",
  "memory_threshold": 75.0,
  "max_sessions": 8,
  "enable_rate_limiting": true,
  "base_delay": [0.8, 1.5]
}
```
**Use for**: REST API docs, OpenAPI specs, developer references

---

## Caching System

### Cache Location
- **Linux/WSL**: `~/.claude/crawled_docs/`
- **Windows**: `C:\Users\{user}\.claude\crawled_docs\`
- **macOS**: `~/.claude/crawled_docs/`

### Cache Features

#### Automatic Token Management
- Content automatically truncated to <2000 tokens for Claude compatibility
- Smart truncation preserves structure (paragraphs, sections)
- Token count tracked per cached entry

#### Deduplication
- URLs hashed with SHA256 for consistent cache keys
- Prevents duplicate crawling of same content
- Updates access count on cache hits

#### Intelligent Cleanup
- Maximum 1000 cached entries
- Automatic removal of least-accessed old entries
- Access tracking for smart cache management

#### Search Capabilities
- Full-text search across titles, URLs, and content
- Ranked results by relevance and access frequency
- Case-insensitive search with regex support

### Cache Structure
```
~/.claude/crawled_docs/
├── a1b2c3d4e5f6g7h8.json  # Hashed cache files
├── f2e3d4c5b6a7h8i9.json  # Each contains:
└── ...                    # - Original URL and metadata
                           # - Token-optimized content
                           # - Access statistics
```

### Example Cache Entry
```json
{
  "url": "https://docs.python.org/3/library/json.html",
  "url_hash": "a1b2c3d4e5f6g7h8",
  "title": "json — JSON encoder and decoder",
  "markdown": "# json Module\n...",
  "status_code": 200,
  "content_length": 1847,
  "cached_at": "2025-09-15T10:30:00Z",
  "access_count": 5,
  "last_accessed": "2025-09-15T11:45:00Z",
  "token_count": 462
}
```

---

## Best Practices

### Efficient Crawling

#### Choose the Right Strategy
- **Complex sites**: Use `browser` strategy for JavaScript-heavy sites
- **Simple content**: Use `http` strategy for static HTML (2-10x faster)
- **Mixed content**: Start with `http`, fallback to `browser` if needed

#### Optimize Batch Sizes
- **Small batches (2-5 URLs)**: Fastest results, good for immediate needs
- **Medium batches (5-8 URLs)**: Balanced performance and completeness
- **Large batches (8-10 URLs)**: Maximum efficiency, best for comprehensive crawling

#### Use Appropriate Presets
- **Research/Learning**: `docs` preset for high-quality extraction
- **News/Updates**: `news` preset for quick content gathering
- **API Integration**: `api` preset for structured documentation

### Cache Management

#### Leverage Cache for Speed
```
Before crawling new content, search cache: "authentication tutorials"
```

#### Periodic Cache Maintenance
```
List cache to see what's accumulated, clear if needed for fresh content
```

#### Smart Cache Usage
```
Get cached content first, only crawl if information is outdated or missing
```

### Token Optimization

#### Let Auto-Truncation Work
- Don't worry about content length - system handles Claude's 2000-token limit
- Truncation preserves important structure and adds continuation hints

#### Use Focused Selectors for Large Pages
```
For large pages, use css_selector to extract specific sections:
css_selector: ".documentation-content"
css_selector: "article"
css_selector: ".main-content"
```

### Performance Tips

#### Concurrent Processing
- Use `max_sessions: 8` for balanced performance
- Increase to `max_sessions: 15` for high-bandwidth environments
- Decrease to `max_sessions: 3` for rate-limited sites

#### Memory Management
- `memory_threshold: 70` for conservative resource usage
- `memory_threshold: 85` for maximum performance
- Monitor system resources during large batch crawls

#### Respectful Crawling
- Rate limiting is enabled by default - don't disable it
- Use appropriate delays between requests
- Consider site load when choosing batch sizes

---

## Troubleshooting

For comprehensive troubleshooting information including installation issues, runtime errors, performance problems, and debugging tools, see the dedicated **[Troubleshooting Guide](TROUBLESHOOTING.md)**.

**Quick troubleshooting tips:**

### Common Issues
- **MCP not working?** Check `which web-crawler-mcp` and restart Claude Code
- **Python errors?** Run `pip install --upgrade crawl4ai && crawl4ai-setup`
- **Slow crawling?** Use HTTP strategy for static sites: `Use crawl-url with HTTP strategy`
- **Cache issues?** Check permissions: `chmod 755 ~/.claude/crawled_docs/`

### Getting Help
- **Installation problems**: See [Developer Setup Guide](DEVELOPER_SETUP.md)
- **MCP integration issues**: See [MCP Integration Guide](MCP_INTEGRATION.md)
- **Detailed troubleshooting**: See [Troubleshooting Guide](TROUBLESHOOTING.md)

---

## Advanced Features

### Custom CSS Selectors

Extract specific content sections:

```javascript
// Documentation content only
css_selector: ".documentation-content, article, .main-content"

// Code examples only
css_selector: "pre, code, .highlight"

// Navigation and main content
css_selector: "nav, main, .content"
```

### Memory and Performance Tuning

Fine-tune for your system:

```javascript
// High-performance setup
{
  "strategy": "http",
  "max_sessions": 15,
  "memory_threshold": 85,
  "max_connections": 30
}

// Conservative setup
{
  "strategy": "browser",
  "max_sessions": 3,
  "memory_threshold": 60,
  "enable_rate_limiting": true
}
```

### Integration Patterns

#### Research Workflow
1. Search cache for existing relevant content
2. Identify gaps in knowledge
3. Batch crawl missing documentation
4. Use cached + new content for comprehensive analysis

#### Development Workflow
1. Cache relevant API documentation
2. Search cache during development
3. Update cache when APIs change
4. Clear cache periodically for fresh content

#### Learning Workflow
1. Crawl tutorial series with `docs` preset
2. Cache references and examples
3. Search cache while practicing
4. Build knowledge base over time

---

## Conclusion

The Web Crawler MCP provides Claude Code with powerful, intelligent web scraping capabilities. By leveraging the caching system, configuration presets, and appropriate crawling strategies, you can efficiently gather and maintain a comprehensive knowledge base of web content.

**Key Benefits**:
- 🚀 **Fast**: Smart caching and optimized strategies
- 🧠 **Intelligent**: Token-aware content management
- 🔄 **Persistent**: Cross-project cache sharing
- ⚙️ **Configurable**: Multiple strategies and presets
- 🛡️ **Respectful**: Built-in rate limiting and resource management

Start with simple single-URL crawls, experiment with different presets, and build up your cached knowledge base for maximum productivity with Claude Code! 🎉