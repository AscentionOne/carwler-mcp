# Web Crawler MCP

Universal cross-platform MCP server for scraping web documentation and generating Claude-friendly markdown files using crawl4ai.

## Features

- **Cross-Platform**: Works on Windows and Linux
- **TypeScript**: Full type safety and IntelliSense support  
- **MCP Ready**: Designed for Claude Code integration
- **Zero Config**: Simple setup with sensible defaults

## Quick Start

### Prerequisites
```bash
# Install Python dependencies
python3 -m pip install crawl4ai
crawl4ai-setup

# Install Node.js dependencies
npm install
```

### Usage
```bash
# Build project
npm run build

# Crawl a URL
npm run dev https://example.com

# Save to file
npm run dev https://docs.python.org/3/ --output docs.md

# Run tests
npm test
```

## Project Structure

```
src/
├── index.ts          # Main entry point
├── crawler.ts        # Core crawler implementation
├── test.ts          # Test suite
└── types/
    └── index.ts      # Type definitions

dist/                 # Compiled JavaScript output
scripts/             # Python crawl4ai wrapper
docs/                # Documentation
```

## Commands

- `npm run build` - Compile TypeScript
- `npm run dev <url>` - Development mode crawling
- `npm test` - Run test suite
- `npm run type-check` - Type checking without compilation

## Storage Locations

- **Windows**: `C:\Users\{user}\.claude\crawled_docs\`
- **Linux**: `~/.claude/crawled_docs/`

## Development

- **Language**: Node.js + TypeScript, Python (crawl4ai subprocess)
- **Target Platforms**: Windows 10+, Linux (Ubuntu 18.04+)
- **Development Environment**: Ubuntu 20.04.6 LTS (WSL2)

## License

MIT