# Web Crawler MCP

> Universal cross-platform MCP server enabling Claude Code to scrape web documentation and generate Claude-friendly markdown files using crawl4ai.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-14%2B-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11%2B-yellow.svg)](https://www.python.org/)
[![MCP](https://img.shields.io/badge/MCP-v2024--11--05-purple.svg)](https://modelcontextprotocol.io/)

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
- [MCP Tools](#mcp-tools)
- [Documentation](#documentation)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

✨ **Key Capabilities:**
- **Claude Code Integration**: 6 MCP tools for seamless web crawling
- **Smart Caching**: Token-optimized cross-platform caching system
- **Cross-Platform**: Windows, Linux, and macOS support
- **High Performance**: 0.7-2.8 URLs/sec with 100% success rate
- **Type Safety**: Full TypeScript implementation
- **Zero Config**: Sensible defaults, ready to use

## Quick Start

### For Claude Code Users

1. **Install the MCP server:**
   ```bash
   git clone https://github.com/yourusername/web-crawler-mcp.git
   cd web-crawler-mcp
   npm install && npm run build && npm install -g .
   ```

2. **Add to Claude Code configuration:**
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

3. **Start using in Claude Code:**
   ```
   Crawl https://docs.python.org/3/library/json.html and summarize it
   ```

### For CLI Users

```bash
# Crawl a single URL
npm run dev https://example.com

# Batch process multiple URLs
echo "https://docs.python.org/3/" | npm run dev --batch -
```

## Installation

### Prerequisites

- **Node.js 14+** - [Download](https://nodejs.org/)
- **Python 3.11+** with crawl4ai:
  ```bash
  python3 -m pip install crawl4ai
  crawl4ai-setup
  ```

### From Source

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/web-crawler-mcp.git
cd web-crawler-mcp

# 2. Install dependencies and build
npm install
npm run build

# 3. Install globally for MCP usage
npm install -g .

# 4. Verify installation
web-crawler-mcp --version
```

**Configuration Locations:**
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux/macOS**: `~/.config/claude/claude_desktop_config.json`

## Usage

### MCP Mode (Recommended)

Add to Claude Code MCP configuration and use natural language:

```
# Single page crawling
Crawl the FastAPI documentation homepage

# Batch documentation crawling
Use crawl-docs to scrape the main Python tutorial sections

# Search cached content
Search my cached docs for "authentication examples"

# Cache management
Show me what documentation I have cached
```

### CLI Mode

```bash
# Basic crawling
npm run dev https://docs.python.org/3/library/json.html

# Save to file
npm run dev https://example.com --output result.md

# Batch processing from file
npm run dev --batch < urls.txt

# Using configuration presets
npm run dev https://docs.site.com --preset docs
```

## MCP Tools

| Tool | Purpose | Example |
|------|---------|---------|
| **`crawl-url`** | Single URL scraping with caching | `Crawl https://docs.python.org/3/library/json.html` |
| **`crawl-docs`** | Batch crawl multiple URLs efficiently | `Crawl these FastAPI tutorial pages with "docs" preset` |
| **`get-cached`** | Retrieve previously crawled content | `Get cached content for the Python JSON docs` |
| **`search-cache`** | Full-text search across cache | `Search cache for "authentication" examples` |
| **`list-cache`** | Browse cache with statistics | `Show me what documentation I have cached` |
| **`clear-cache`** | Manage and clean cache | `Clear cached content older than 30 days` |

### Configuration Presets

| Preset | Use Case | Performance | Quality |
|--------|----------|-------------|---------|
| `docs` | Technical documentation | Medium | High |
| `news` | Blog posts, articles | Fast | Good |
| `api` | API documentation | Fast | High |

## Documentation

📚 **Complete Documentation:**

| Guide | Purpose | Audience |
|-------|---------|----------|
| **[User Guide](docs/USER_GUIDE.md)** | Complete manual with quick start | End users |
| **[API Reference](docs/API_REFERENCE.md)** | Technical MCP tools specs | Developers |
| **[MCP Integration](docs/MCP_INTEGRATION.md)** | Claude Code setup guide | Claude users |
| **[Developer Setup](docs/DEVELOPER_SETUP.md)** | Installation from source | Contributors |
| **[Troubleshooting](docs/TROUBLESHOOTING.md)** | Common issues & solutions | All users |

## Development

### Project Structure

```
web-crawler-mcp/
├── src/
│   ├── index.ts          # CLI entry point
│   ├── mcp-server.ts     # MCP server implementation
│   ├── crawler.ts        # Core crawling logic
│   ├── cache.ts          # Caching system
│   └── config.ts         # Configuration management
├── docs/                 # Documentation
├── scripts/              # Python integration
└── tests/               # Test suite
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript |
| `npm run mcp` | Start MCP server |
| `npm run dev <url>` | CLI crawling mode |
| `npm test` | Run test suite |
| `npm run type-check` | TypeScript validation |

### Technology Stack

- **Runtime**: Node.js 14+ with TypeScript 5.0
- **Web Crawling**: Python crawl4ai v0.7.x subprocess
- **Protocol**: MCP (Model Context Protocol) v2024-11-05
- **Caching**: Cross-platform file-based cache
- **Testing**: Jest with TypeScript support

### Cache System

- **Location**: `~/.claude/crawled_docs/` (cross-platform)
- **Features**: Token optimization (<2000 tokens), deduplication, full-text search
- **Management**: Automatic cleanup, access tracking, intelligent truncation

## Troubleshooting

### Common Issues

| Issue | Solution |5
|-------|----------|
| "Command not found: web-crawler-mcp" | Run `npm install -g .` in project directory |
| "Python process failed" | Install crawl4ai: `pip install crawl4ai && crawl4ai-setup` |
| MCP tools not appearing in Claude | Restart Claude Code after config change |
| Cache permission errors | Fix permissions: `chmod 755 ~/.claude/crawled_docs/` |

### Getting Help

1. Check the **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)**
2. Review **[API Documentation](docs/API_REFERENCE.md)**
3. **[Open an issue](https://github.com/yourusername/web-crawler-mcp/issues)** for bugs
4. **[Request features](https://github.com/yourusername/web-crawler-mcp/issues)** for enhancements

## Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes with tests
4. Run the test suite: `npm test`
5. Submit a pull request

### Development Setup

```bash
git clone https://github.com/yourusername/web-crawler-mcp.git
cd web-crawler-mcp
npm install
npm run build
npm test
```

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Quick Links

- **[Quick Start Guide](docs/USER_GUIDE.md#getting-started)**
- **[Installation Guide](docs/DEVELOPER_SETUP.md)**
- **[Complete Documentation](docs/README.md)**
- **[Report Issues](https://github.com/yourusername/web-crawler-mcp/issues)**
