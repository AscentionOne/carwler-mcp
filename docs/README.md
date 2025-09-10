# Crawl4AI Documentation

This directory contains comprehensive documentation for integrating Crawl4AI with your Node.js web scraping project.

## Documentation Files

### 📚 **[crawl4ai-basics.md](./crawl4ai-basics.md)**
Essential Crawl4AI usage patterns and core functionality:
- Installation instructions
- Basic Python usage examples
- Configuration options
- CLI commands
- Key result properties

### 🚀 **[crawl4ai-advanced.md](./crawl4ai-advanced.md)**
Advanced features and configuration:
- Browser and crawler configuration objects
- Extraction strategies (CSS, LLM-based)
- Proxy configuration and rotation
- Performance optimization
- Session management
- Memory monitoring

### 🔧 **[nodejs-integration.md](./nodejs-integration.md)**
Complete Node.js integration patterns:
- Python subprocess integration
- Express.js API server
- Caching strategies
- Error handling patterns
- Testing approaches
- Production-ready examples

### 🩺 **[troubleshooting.md](./troubleshooting.md)**
Comprehensive troubleshooting guide:
- Installation issues and solutions
- Common runtime errors
- Performance optimization
- Debugging tools
- Health check utilities
- Emergency recovery procedures

### 📋 **[integration-strategy.md](./integration-strategy.md)**
High-level integration approach and benefits of using Crawl4AI with Node.js through subprocess communication.

## Quick Start

1. **Install Crawl4AI (Python)**:
   ```bash
   pip install crawl4ai
   crawl4ai-setup
   ```

2. **Set up Node.js integration**:
   ```bash
   # Create Python wrapper script
   cp examples/scrape.py scripts/scrape.py
   chmod +x scripts/scrape.py
   
   # Install Node.js dependencies (if using Express)
   npm install express
   ```

3. **Test the integration**:
   ```javascript
   const { Crawl4AIScraper } = require('./src/scraper');
   
   const scraper = new Crawl4AIScraper();
   const result = await scraper.scrapeUrl('https://example.com');
   console.log(result.markdown);
   ```

## Architecture Overview

```
┌─────────────────┐    JSON/subprocess    ┌─────────────────┐
│                 │  ─────────────────→   │                 │
│    Node.js      │                       │     Python      │
│  Application    │  ←─────────────────   │   Crawl4AI      │
│                 │    Markdown Result    │                 │
└─────────────────┘                       └─────────────────┘
```

## Key Benefits

- ✅ **Simple Integration**: No complex bindings or dependencies
- ✅ **Proven Technology**: Leverages mature Crawl4AI Python library
- ✅ **Clean Separation**: Node.js handles API/business logic, Python handles scraping
- ✅ **Flexible**: Easy to extend and customize for specific needs
- ✅ **Maintainable**: Clear separation of concerns

## Getting Help

1. **Check the troubleshooting guide** for common issues
2. **Run health checks** using provided utilities
3. **Test individual components** using the examples
4. **Review error logs** for specific error patterns

## Project Structure

```
project/
├── docs/                          # This documentation
├── src/
│   ├── scraper.js                # Main Node.js integration
│   └── cache.js                  # Optional caching layer
├── scripts/
│   └── scrape.py                 # Python wrapper script
├── test/
│   └── integration.test.js       # Integration tests
└── cache/                        # Cache directory (auto-created)
```

## Next Steps

1. Review the **[crawl4ai-basics.md](./crawl4ai-basics.md)** for core concepts
2. Study **[nodejs-integration.md](./nodejs-integration.md)** for implementation details
3. Set up your development environment following the installation guides
4. Run the provided health checks to verify everything works
5. Start building your scraper using the provided patterns

---

*This documentation is designed to be self-contained and offline-accessible, providing everything you need to successfully integrate Crawl4AI with Node.js.*