# Developer Setup Guide

Complete guide for setting up the Web Crawler MCP server from GitHub clone to working Claude Code integration.

## Overview

This guide walks you through:
1. **Environment Setup**: Prerequisites and system requirements
2. **Installation**: GitHub clone to working MCP server
3. **Verification**: Testing the installation works correctly
4. **Claude Code Integration**: Adding MCP server to Claude Code

## Prerequisites

### System Requirements
- **Node.js**: 14.0.0 or higher
- **Python**: 3.11+ (required for crawl4ai)
- **Operating System**: Windows 10+, Linux (Ubuntu 18.04+), or macOS
- **Memory**: 512MB+ available RAM
- **Storage**: 100MB+ for installation and cache

### Python Environment Setup

#### Ubuntu/Linux
```bash
# Install Python 3.11+ if not available
sudo apt update
sudo apt install python3.11 python3.11-pip

# Verify Python version
python3.11 --version

# Install crawl4ai
python3.11 -m pip install crawl4ai
crawl4ai-setup
```

#### Windows
```bash
# Install Python 3.11+ from python.org
# Verify installation
python --version

# Install crawl4ai
pip install crawl4ai
crawl4ai-setup
```

#### macOS
```bash
# Using Homebrew
brew install python@3.11

# Verify installation
python3.11 --version

# Install crawl4ai
python3.11 -m pip install crawl4ai
crawl4ai-setup
```

### Node.js Environment Setup

#### Ubuntu/Linux
```bash
# Using NodeSource repository (recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Windows
```bash
# Download from nodejs.org or use chocolatey
choco install nodejs

# Verify installation
node --version
npm --version
```

#### macOS
```bash
# Using Homebrew
brew install node

# Verify installation
node --version
npm --version
```

## Installation Process

### Step 1: Clone Repository
```bash
# Clone the repository
git clone https://github.com/yourusername/web-crawler-mcp.git
cd web-crawler-mcp

# Verify project structure
ls -la
```

**Expected output:**
```
docs/                 # Documentation files
src/                  # TypeScript source code
scripts/              # Python crawl4ai wrapper
package.json          # Node.js dependencies
tsconfig.json         # TypeScript configuration
```

### Step 2: Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Verify dependencies installed
npm list --depth=0
```

**Expected dependencies:**
- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `typescript`: TypeScript compiler
- `@types/node`: Node.js type definitions
- `zod`: Schema validation

### Step 3: Build Project
```bash
# Compile TypeScript to JavaScript
npm run build

# Verify build output
ls -la dist/
```

**Expected output:**
```
dist/
├── index.js          # CLI entry point
├── mcp-server.js     # MCP server
├── crawler.js        # Core crawler
├── cache.js          # Caching system
├── config.js         # Configuration
└── types/            # Type definitions
```

### Step 4: Test Basic Functionality
```bash
# Test CLI crawler (optional)
npm run dev https://example.com

# Expected: Clean markdown output
```

### Step 5: Install Globally for Local Use
```bash
# Install as global command
npm install -g .

# Verify global installation
web-crawler-mcp --version
which web-crawler-mcp
```

**Expected output:**
```
1.0.0
/usr/local/bin/web-crawler-mcp (or equivalent path)
```

## Verification & Testing

### Test MCP Server Startup
```bash
# Start MCP server (should run without errors)
web-crawler-mcp

# Expected: MCP server listening on stdio
# Ctrl+C to stop
```

### Test Cache Directory Creation
```bash
# The cache directory should be automatically created:
# Linux/macOS: ~/.claude/crawled_docs/
# Windows: C:\Users\{user}\.claude\crawled_docs\

# Check cache directory exists
ls -la ~/.claude/crawled_docs/  # Linux/macOS
dir "%USERPROFILE%\.claude\crawled_docs\"  # Windows
```

### Test Python Integration
```bash
# Test Python subprocess integration
python3.11 scripts/scrape.py https://example.com

# Expected: JSON output with markdown content
```

## Claude Code Integration

### Step 1: Locate Claude Code Configuration

**Configuration file locations:**
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

### Step 2: Add MCP Server Configuration
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

**If file doesn't exist, create it with the complete configuration above.**

### Step 3: Restart Claude Code
1. Close Claude Code completely
2. Restart Claude Code
3. Verify MCP server connection in Claude Code settings

### Step 4: Test MCP Integration
In Claude Code, try using MCP tools:
```
Use the crawl-url tool to scrape https://example.com
```

**Expected behavior:**
- Claude Code should recognize the MCP tools
- Web crawling should work and return markdown content
- Cache should be populated in `~/.claude/crawled_docs/`

## Troubleshooting Installation

### Common Issues

#### "Command not found: web-crawler-mcp"
```bash
# Check global installation
npm list -g --depth=0 | grep web-crawler-mcp

# Reinstall globally
npm install -g .

# Check PATH includes npm global bin
echo $PATH | grep npm  # Linux/macOS
echo %PATH% | findstr npm  # Windows
```

#### "Python not found" or crawl4ai errors
```bash
# Verify Python installation
python3.11 --version
which python3.11  # Linux/macOS
where python  # Windows

# Reinstall crawl4ai
pip uninstall crawl4ai
pip install crawl4ai
crawl4ai-setup
```

#### MCP server not connecting to Claude Code
1. **Check configuration file syntax** (valid JSON)
2. **Verify command path**: `which web-crawler-mcp`
3. **Check Claude Code logs** for connection errors
4. **Test manual startup**: `web-crawler-mcp` should run without errors

#### Cache permission errors
```bash
# Linux/macOS: Fix permissions
chmod 755 ~/.claude/
chmod 755 ~/.claude/crawled_docs/

# Windows: Run as administrator if needed
```

### Environment-Specific Issues

#### WSL2 (Windows Subsystem for Linux)
- Use Linux paths and commands within WSL2
- Ensure Python is the WSL2 version, not Windows version
- Claude Code configuration uses Windows paths

#### Corporate Networks
- May need proxy configuration for npm/pip
- Some networks block GitHub clone operations
- crawl4ai may require network access for browser downloads

## Next Steps

Once installation is complete:
1. **Read [MCP Integration Guide](MCP_INTEGRATION.md)** for detailed usage
2. **Review [API Reference](API_REFERENCE.md)** for all available tools
3. **Check [Troubleshooting Guide](TROUBLESHOOTING.md)** for common issues

## Development Setup (Optional)

For developers who want to modify the code:

```bash
# Development with automatic rebuilding
npm run build:watch

# Run tests
npm test

# Type checking only
npm run type-check

# Development mode (CLI)
npm run dev https://example.com
```

### Development Dependencies
- Jest for testing
- TypeScript for type safety
- ESLint for code quality (future)
- Prettier for formatting (future)

## Support

If you encounter issues not covered in this guide:
1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review existing GitHub issues
3. Create a new issue with:
   - Your operating system and version
   - Node.js and Python versions
   - Complete error messages
   - Steps to reproduce the problem