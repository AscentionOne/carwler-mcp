# Claude Web Crawler MCP Agent - Product Requirements Document

## Executive Summary

The Claude Web Crawler MCP Agent is a universal cross-platform MCP server that enables Claude Code to scrape web documentation and generate LLM-friendly markdown files. This agent eliminates the need for expensive scraping services by leveraging the open-source crawl4ai library, while providing seamless integration across Windows and WSL Ubuntu systems.

## Problem Statement

### Current Pain Points
- **Manual Documentation Gathering**: Developers manually copy-paste documentation into Claude Code sessions
- **Service Costs**: Existing web scraping solutions require paid APIs or services
- **Platform Inconsistency**: Different tools work differently on Windows vs WSL environments
- **Poor LLM Formatting**: Raw HTML content is not optimized for LLM consumption
- **No Persistence**: Documentation needs to be re-fetched for each session

### Target Users
- **Primary**: Developers using Claude Code for software development
- **Secondary**: Technical writers and documentation maintainers
- **Tertiary**: Teams needing centralized documentation caching

## Product Vision

Create a simple, effective web scraping tool that evolves from a basic personal crawler to a full MCP server, providing clean markdown content for Claude usage across all development workflows.

## Development Philosophy: Start Simple, Evolve to Complex

### Why This Approach?
- ✅ **Immediate Value**: Working tool in hours, not weeks
- ✅ **Learn by Building**: Understand the domain before adding complexity  
- ✅ **Validated Patterns**: Prove the approach works before scaling
- ✅ **User-Driven Evolution**: Add features based on actual usage

## Goals and Objectives

### Phase 1 Goals (Basic Personal Crawler)
1. **Immediate Utility**: URL → Clean markdown for Claude in minutes
2. **Simple Integration**: Node.js + Python subprocess pattern  
3. **Reliable Core**: Basic error handling and caching
4. **Easy Testing**: Quick validation with real websites

### Phase 2 Goals (Enhanced Crawler)  
1. **Production Ready**: Batch processing, better error handling
2. **User Experience**: Improved CLI or web interface
3. **Performance**: Caching and optimization
4. **Configuration**: Customizable for different use cases

### Phase 3 Goals (MCP Integration)
1. **Claude Integration**: Native MCP server for Claude Code
2. **Universal Access**: Single agent usable across all projects
3. **Zero Configuration**: Works immediately after installation  
4. **Advanced Features**: Search, auto-updates, team sharing

### Success Metrics
- **Adoption**: 1000+ npm downloads within 3 months
- **Performance**: Single page crawl < 5 seconds
- **Reliability**: 99% success rate on major documentation sites
- **Storage Efficiency**: < 10MB per typical documentation site
- **User Satisfaction**: 4.5+ star rating on npm

## User Stories by Phase

### Phase 1: Basic Personal Crawler
**Epic**: Simple URL-to-Markdown Conversion

**User Stories:**
- As a developer, I want to run `node crawler.js <url>` and get clean markdown output
- As a developer, I want the tool to work immediately after setup with no configuration  
- As a developer, I want basic error messages when URLs fail to scrape
- As a developer, I want the markdown formatted well for pasting into Claude

### Phase 2: Enhanced Personal Crawler  
**Epic**: Production-Ready Features

**User Stories:**
- As a developer, I want to scrape multiple URLs in batch mode
- As a developer, I want cached content to avoid re-scraping the same pages
- As a developer, I want to configure CSS selectors for specific sites
- As a developer, I want a simple web interface to manage scraping jobs
- As a developer, I want to save scraped content to organized files

### Phase 3: MCP Server Integration
**Epic**: Claude Code Native Integration  

**User Stories:**
- As a Claude Code user, I want to call the crawler through the Task system
- As a Claude Code user, I want scraped content formatted for easy reading  
- As a developer, I want to search through my cached documentation
- As a developer, I want automatic updates when source material changes
- As a team, I want to share cached documentation across projects

### Evolution Path
```
Phase 1: Personal Tool (1-2 days)
   ↓
Phase 2: Enhanced Features (3-5 days)  
   ↓
Phase 3: MCP Integration (1-2 weeks)
```

Each phase provides immediate value while building toward the full vision.

## Functional Requirements by Phase

### Phase 1: Basic Crawler Functions
**Core Command**: `node crawler.js <url>`

#### Basic Features
- **URL Processing**: Single URL input with validation
- **Markdown Output**: Clean HTML-to-markdown conversion  
- **Error Handling**: Clear error messages for common failures
- **Simple Caching**: File-based cache to avoid re-scraping

#### Technical Requirements
- Node.js subprocess integration with Python Crawl4AI
- Basic configuration (CSS selectors, excluded tags)
- Output to console or save to file
- Cross-platform compatibility (Windows/Linux)

### Phase 2: Enhanced Crawler Functions  
**Core Command**: Enhanced CLI with options

#### Batch Processing
- **Multiple URLs**: Process list of URLs from file or stdin
- **Concurrent Processing**: Configurable parallel requests
- **Progress Tracking**: Visual progress indicators
- **Results Management**: Organized output files by domain/date

#### Advanced Configuration
- **Site-Specific Settings**: Per-domain CSS selectors and rules
- **Content Filtering**: Word count thresholds, tag exclusions
- **Caching Strategy**: TTL-based cache with manual refresh
- **Output Formats**: Markdown, JSON, or structured directories

### Phase 3: MCP Server Functions
**Core Interface**: MCP protocol commands

#### MCP Commands
- **crawl-url**: Single page scraping with options
- **crawl-docs**: Deep crawling with depth limits  
- **get-cached**: Retrieve previously scraped content
- **search-cache**: Full-text search through cached content
- **list-cache**: Browse cached documentation
- **update-cache**: Refresh cached content intelligently
- **clear-cache**: Remove cached content with patterns

#### Advanced Features  
- **Claude Integration**: Native Task system integration
- **Content Intelligence**: Framework detection, TOC generation
- **Team Features**: Shared caching, collaborative updates

### Content Processing Features

#### Markdown Generation
- Clean HTML to markdown conversion
- Code block preservation with syntax highlighting
- Table formatting preservation
- Link structure maintenance
- Image handling and optimization

#### Metadata Extraction
- Source URL and crawl timestamp
- Content hash for change detection
- Navigation structure extraction
- Table of contents generation
- Framework detection (Docusaurus, GitBook, etc.)

#### Content Intelligence
- Automatic documentation framework detection
- Navigation structure preservation  
- Code example identification and formatting
- Duplicate content removal
- Content quality scoring

## Non-Functional Requirements

### Performance Requirements
- **Response Time**: Single page crawl < 5 seconds
- **Throughput**: Handle 10 concurrent crawl requests
- **Memory Usage**: < 512MB during normal operation
- **Storage**: Efficient deduplication, < 10MB per documentation site
- **Startup Time**: MCP server ready in < 3 seconds

### Reliability Requirements
- **Availability**: 99.9% uptime for MCP server
- **Error Recovery**: Graceful handling of network failures
- **Data Integrity**: Content hash validation for cached files
- **Timeout Handling**: Configurable timeouts for slow sites

### Security Requirements
- **robots.txt Compliance**: Respect website crawling policies
- **Rate Limiting**: Respectful crawling with configurable delays
- **Data Privacy**: No external data transmission beyond target sites
- **Input Validation**: Sanitize all URLs and parameters

### Compatibility Requirements
- **Node.js**: Version 18.0.0 or higher
- **Python**: Version 3.8+ for crawl4ai dependency
- **Operating Systems**: Windows 10+, Linux (Ubuntu 18.04+)
- **MCP Protocol**: Compatible with Claude Code's Task system

## Technical Architecture

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Scraping Engine**: crawl4ai (Python subprocess)
- **Protocol**: MCP (Model Context Protocol)
- **Storage**: File-system based with JSON metadata
- **Distribution**: npm package

### System Components

#### MCP Server (`index.ts`)
- Protocol implementation and command routing
- Connection management and error handling
- Logging and monitoring integration

#### Crawler Engine (`crawler.ts`)  
- crawl4ai integration and subprocess management
- Content processing and markdown generation
- Error handling for Python dependencies

#### Storage System (`storage.ts`)
- Cross-platform file operations
- Caching with metadata management
- Content fingerprinting and deduplication

#### Configuration Manager (`config.ts`)
- OS detection and path normalization
- User configuration management
- Default settings and validation

#### Utilities (`utils.ts`)
- URL validation and normalization
- Content hashing and comparison
- Logging and error formatting

### Cross-Platform Strategy

#### Storage Location Strategy
```
Windows: C:\Users\{user}\.claude\crawled_docs\
Linux:   ~/.claude/crawled_docs/
```

#### Path Handling
- Automatic OS detection
- Dynamic path resolution
- Shared storage accessibility from WSL

#### Python Integration
- Cross-platform Python executable detection
- Subprocess error handling and recovery
- Virtual environment support

## Integration Requirements

### Claude Code Integration
The agent registers as a `web-crawler` subagent type, callable via:

```typescript
Task({
  subagent_type: "web-crawler",
  description: "Scrape FastAPI docs", 
  prompt: "Crawl https://fastapi.tiangolo.com/ and generate clean markdown for the main documentation sections"
})
```

### Output Format Specification
Generated markdown files include:
- Metadata headers (source URL, crawl date, content hash)
- Clean, structured content optimized for LLMs
- Preserved code examples with syntax highlighting
- Internal link preservation where possible
- File:line references for easy navigation

### Configuration Interface
```typescript
interface CrawlerConfig {
  storageDir: string          // Storage location
  maxDepth: number           // Maximum crawl depth
  respectRobotsTxt: boolean  // Honor robots.txt
  rateLimit: number          // Delay between requests (ms)
  timeout: number            // Request timeout (ms) 
  userAgent: string          // HTTP user agent
  cacheExpiry: number        // Cache validity period (ms)
}
```

## User Experience Requirements

### Installation Experience
- Single command installation: `npm install -g claude-web-crawler-mcp`
- Automatic dependency detection and installation
- Clear error messages for missing dependencies
- Platform-specific setup instructions

### Usage Experience  
- Intuitive command names that match user mental models
- Progressive disclosure of advanced options
- Clear progress indicators for long operations
- Helpful error messages with resolution suggestions

### Configuration Experience
- Works with zero configuration out of the box
- Optional configuration file for power users
- Environment variable support for CI/CD
- Validation and helpful defaults for all settings

## Risk Assessment and Mitigation

### Technical Risks

#### crawl4ai Compatibility
- **Risk**: Python dependency issues across platforms
- **Mitigation**: Comprehensive installation validation and fallback options
- **Monitoring**: Automated testing on multiple OS configurations

#### Performance and Memory
- **Risk**: Memory leaks during large crawling operations
- **Mitigation**: Streaming processing and memory monitoring
- **Monitoring**: Performance benchmarks in CI/CD pipeline

#### Rate Limiting and Blocking
- **Risk**: Target websites blocking or rate limiting requests
- **Mitigation**: Respectful crawling practices and configurable delays
- **Monitoring**: Success rate tracking and retry logic

### Operational Risks

#### Maintenance Burden
- **Risk**: Ongoing dependency updates and compatibility issues
- **Mitigation**: Automated dependency monitoring and testing
- **Monitoring**: Regular security audits and update schedules

#### User Support
- **Risk**: Complex cross-platform installation issues
- **Mitigation**: Comprehensive documentation and troubleshooting guides
- **Monitoring**: Community feedback channels and issue tracking

## Success Criteria and Validation

### Acceptance Criteria
1. **Installation Success**: 95% successful installations across target platforms
2. **Performance Targets**: All performance requirements met in benchmarks
3. **Integration Success**: Seamless operation with Claude Code Task system
4. **User Adoption**: Positive feedback from beta users
5. **Documentation Quality**: Complete API documentation and usage examples

### Testing Strategy
- **Unit Tests**: 90%+ code coverage for core functionality
- **Integration Tests**: Cross-platform compatibility validation
- **Performance Tests**: Benchmark testing against requirements
- **User Acceptance Tests**: Real-world usage scenarios

### Launch Criteria
- All acceptance criteria met
- Security audit completed
- Documentation finalized
- CI/CD pipeline operational
- Beta user feedback incorporated

## Timeline and Milestones

### Phase 1: Foundation (Week 1)
- Project setup and basic MCP server
- Cross-platform foundation
- Basic crawl4ai integration

### Phase 2: Core Features (Week 2)  
- All core MCP commands implemented
- Storage system with caching
- Content processing pipeline

### Phase 3: Polish (Week 3)
- Advanced features and intelligence
- Comprehensive error handling
- Performance optimization

### Phase 4: Release (Week 4)
- Testing and quality assurance
- Documentation completion
- npm package preparation and distribution

## Future Enhancements

### Phase 2 Features (Post-MVP)
- **Scheduled Updates**: Automatic re-crawling of favorite sites
- **Content Summarization**: AI-powered content summarization
- **API Documentation**: Special handling for OpenAPI/Swagger specs
- **Team Features**: Shared caching across team members

### Integration Opportunities
- **GitHub Integration**: Auto-crawl repository documentation
- **IDE Extensions**: Direct integration with VS Code
- **CI/CD Integration**: Documentation updates in build pipelines

---

**Document Version**: 1.0  
**Last Updated**: 2025-09-08  
**Status**: Draft for Review  
**Stakeholders**: Development Team, Product Management, QA Team