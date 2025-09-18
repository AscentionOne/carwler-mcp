# Troubleshooting Guide

Common issues and solutions for Web Crawler MCP server installation and usage.

## Installation Issues

### "Command not found: web-crawler-mcp"

**Problem**: After running `npm install -g .`, the global command is not available.

**Solutions**:

1. **Check global installation**:
   ```bash
   npm list -g --depth=0 | grep web-crawler-mcp
   ```

2. **Verify PATH includes npm global bin**:
   ```bash
   # Linux/macOS
   echo $PATH | grep npm
   npm config get prefix

   # Windows
   echo %PATH% | findstr npm
   npm config get prefix
   ```

3. **Reinstall globally**:
   ```bash
   npm uninstall -g web-crawler-mcp
   npm install -g .
   ```

4. **Use full path if needed**:
   ```bash
   # Find installation location
   which web-crawler-mcp  # Linux/macOS
   where web-crawler-mcp  # Windows
   ```

### Python Installation Issues

#### "python3.11 not found"

**Problem**: Python 3.11+ not available or incorrectly installed.

**Solutions**:

1. **Install Python 3.11+**:
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install python3.11 python3.11-pip

   # Windows - Download from python.org
   # macOS
   brew install python@3.11
   ```

2. **Verify installation**:
   ```bash
   python3.11 --version
   which python3.11  # Linux/macOS
   where python3.11  # Windows
   ```

#### "crawl4ai installation failed"

**Problem**: crawl4ai installation or setup fails.

**Solutions**:

1. **Clean reinstall**:
   ```bash
   pip uninstall crawl4ai
   pip install crawl4ai
   crawl4ai-setup
   ```

2. **Check network access**:
   ```bash
   # Test PyPI access
   pip install --dry-run crawl4ai

   # Corporate networks may need proxy settings
   pip install --proxy http://proxy:port crawl4ai
   ```

3. **Manual browser setup**:
   ```bash
   # If crawl4ai-setup fails
   python3.11 -c "from crawl4ai import AsyncWebCrawler; AsyncWebCrawler().install_playwright()"
   ```

### TypeScript Build Issues

#### "tsc: command not found"

**Problem**: TypeScript compiler not available.

**Solutions**:

1. **Install TypeScript globally**:
   ```bash
   npm install -g typescript
   ```

2. **Use local TypeScript**:
   ```bash
   npx tsc
   ```

3. **Verify package dependencies**:
   ```bash
   npm install  # Ensure all dependencies installed
   ```

## MCP Integration Issues

### Claude Code Not Detecting MCP Server

**Problem**: MCP server configured but Claude Code doesn't see the tools.

**Solutions**:

1. **Verify configuration file location**:
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/claude/claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

2. **Check JSON syntax**:
   ```bash
   # Validate JSON syntax
   cat ~/.config/claude/claude_desktop_config.json | jq .
   ```

3. **Verify MCP server executable**:
   ```bash
   # Test manual startup
   web-crawler-mcp
   # Should run without errors, Ctrl+C to stop
   ```

4. **Restart Claude Code completely**:
   - Close all Claude Code windows
   - Quit Claude Code application
   - Restart Claude Code

### MCP Tools Return Errors

#### "Tool execution failed"

**Problem**: MCP tools fail when called from Claude Code.

**Solutions**:

1. **Check server logs**:
   ```bash
   # Run MCP server manually to see error messages
   web-crawler-mcp
   ```

2. **Test with simple URL**:
   ```
   Use crawl-url to scrape https://example.com
   ```

3. **Verify cache permissions**:
   ```bash
   # Linux/macOS
   ls -la ~/.claude/crawled_docs/
   chmod 755 ~/.claude/crawled_docs/

   # Windows - Check folder permissions
   ```

#### "Python subprocess failed"

**Problem**: MCP tools fail due to Python/crawl4ai errors.

**Solutions**:

1. **Test Python integration directly**:
   ```bash
   python3.11 scripts/scrape.py https://example.com
   ```

2. **Check Python path in MCP server**:
   ```bash
   # Verify Python executable location
   which python3.11
   ```

3. **Network connectivity issues**:
   ```bash
   # Test network access
   curl -I https://example.com
   ```

## Runtime Issues

### Cache Permission Errors

**Problem**: Cannot read/write cache files.

**Solutions**:

1. **Fix cache directory permissions**:
   ```bash
   # Linux/macOS
   mkdir -p ~/.claude/crawled_docs/
   chmod 755 ~/.claude/
   chmod 755 ~/.claude/crawled_docs/

   # Windows - Run as administrator if needed
   ```

2. **Check disk space**:
   ```bash
   df -h ~/.claude/  # Linux/macOS
   dir "C:\Users\%USERNAME%\.claude"  # Windows
   ```

3. **Clear corrupted cache**:
   ```bash
   # Remove and recreate cache directory
   rm -rf ~/.claude/crawled_docs/
   mkdir -p ~/.claude/crawled_docs/
   ```

### Memory Issues

**Problem**: High memory usage or out-of-memory errors.

**Solutions**:

1. **Use HTTP strategy for static content**:
   ```
   Use crawl-url to scrape https://docs.python.org/ using HTTP strategy
   ```

2. **Reduce concurrent sessions**:
   ```
   Use crawl-docs with max 2 concurrent sessions for these URLs
   ```

3. **Clear cache regularly**:
   ```
   Use clear-cache to remove content older than 30 days
   ```

### Network Issues

#### Timeout Errors

**Problem**: Requests timing out or failing.

**Solutions**:

1. **Increase timeout**:
   ```
   Use crawl-url to scrape https://slow-site.com with 120 second timeout
   ```

2. **Check network connectivity**:
   ```bash
   ping google.com
   curl -I https://target-site.com
   ```

3. **Corporate firewall/proxy**:
   - Configure proxy settings in environment variables
   - Check if crawl4ai can access external sites

#### SSL Certificate Errors

**Problem**: SSL/TLS certificate validation failures.

**Solutions**:

1. **Update certificates**:
   ```bash
   # Linux
   sudo apt update && sudo apt install ca-certificates

   # Windows - Update Windows
   # macOS
   brew install ca-certificates
   ```

2. **Check system time**:
   ```bash
   # Ensure system clock is accurate
   date
   ```

## Performance Issues

### Slow Crawling Performance

**Problem**: Crawling takes much longer than expected.

**Solutions**:

1. **Use HTTP strategy for static sites**:
   ```
   Use crawl-url with HTTP strategy for faster processing of https://docs.site.com
   ```

2. **Optimize batch processing**:
   ```
   Use crawl-docs with maximum 3 concurrent sessions
   ```

3. **Check system resources**:
   ```bash
   # Monitor CPU and memory
   top  # Linux/macOS
   taskmgr  # Windows
   ```

### High Memory Usage

**Problem**: MCP server using excessive memory.

**Solutions**:

1. **Monitor memory usage**:
   ```bash
   ps aux | grep web-crawler-mcp  # Linux/macOS
   ```

2. **Restart MCP server periodically**:
   - Close Claude Code
   - Restart Claude Code (restarts MCP server)

3. **Use smaller batch sizes**:
   ```
   Use crawl-docs to process URLs in smaller batches of 3-5 URLs
   ```

## Error Messages Reference

### Common Error Messages and Solutions

#### "ENOENT: no such file or directory"
- **Cause**: Missing cache directory or file
- **Solution**: Recreate cache directory: `mkdir -p ~/.claude/crawled_docs/`

#### "EACCES: permission denied"
- **Cause**: Insufficient permissions for cache directory
- **Solution**: Fix permissions: `chmod 755 ~/.claude/crawled_docs/`

#### "spawn python3.11 ENOENT"
- **Cause**: Python 3.11+ not found in PATH
- **Solution**: Install Python 3.11+ or update PATH

#### "Connection refused" or "ECONNRESET"
- **Cause**: Network connectivity issues
- **Solution**: Check internet connection and proxy settings

#### "JSON parsing error"
- **Cause**: Corrupted cache file or invalid JSON
- **Solution**: Clear cache and retry: `clear-cache` tool

## Getting Additional Help

### Diagnostic Information

When reporting issues, include:

1. **System information**:
   ```bash
   uname -a  # Linux/macOS
   systeminfo | findstr "OS"  # Windows
   ```

2. **Node.js and Python versions**:
   ```bash
   node --version
   npm --version
   python3.11 --version
   ```

3. **Installation verification**:
   ```bash
   which web-crawler-mcp
   npm list -g web-crawler-mcp
   ```

4. **Error logs**:
   - Complete error messages
   - Steps to reproduce
   - Expected vs actual behavior

### Support Resources

1. **Documentation**:
   - [Developer Setup Guide](DEVELOPER_SETUP.md)
   - [MCP Integration Guide](MCP_INTEGRATION.md)
   - [API Reference](API_REFERENCE.md)

2. **Testing**:
   ```bash
   # Run built-in tests
   npm test

   # Manual MCP server test
   web-crawler-mcp
   ```

3. **Community Support**:
   - GitHub Issues: Report bugs and feature requests
   - Check existing issues for similar problems
   - Provide detailed reproduction steps

### Emergency Recovery

If the installation is completely broken:

1. **Complete uninstall**:
   ```bash
   npm uninstall -g web-crawler-mcp
   rm -rf ~/.claude/crawled_docs/
   ```

2. **Clean reinstall**:
   ```bash
   git clone https://github.com/yourusername/web-crawler-mcp.git
   cd web-crawler-mcp
   npm install
   npm run build
   npm install -g .
   ```

3. **Verify installation**:
   ```bash
   web-crawler-mcp --version
   ```