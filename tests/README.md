# Testing Suite Documentation

Professional TypeScript testing suite for the Web Crawler MCP project.

## Directory Structure

```
tests/
├── unit/                   # Unit tests for individual components
│   ├── cache.test.ts      # Cache functionality tests (120+ cases)
│   └── crawler.test.ts    # Crawler functionality tests (60+ cases)
├── integration/           # Integration tests
│   └── mcp-protocol.test.ts # MCP protocol compliance tests (60+ cases)
├── helpers/               # Test utilities and helpers
│   ├── test-utils.ts     # Common testing utilities and mocks
│   └── mcp-test-client.ts # MCP protocol test client
├── fixtures/              # Test data and mock responses
│   ├── test-urls.json    # Organized test URLs by category
│   └── mock-responses.json # Mock HTTP responses for testing
├── manual/                # Manual testing tools
│   └── mcp-interactive-test.js # Interactive MCP protocol debugging
├── archive/               # Legacy code preservation
│   └── legacy-typescript-demo.ts # Original TypeScript demo
└── setup.ts               # Global Jest configuration
```

## Available Test Scripts

```bash
# Run all tests
npm test

# Run with coverage reporting
npm run test:coverage

# Run in watch mode (development)
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Manual MCP server testing
npm run test:manual

# Verbose output
npm run test:verbose
```

## Test Categories

### Unit Tests
- **Cache Tests**: File system operations, token optimization, search functionality
- **Crawler Tests**: Python subprocess integration, URL validation, batch processing
- **Configuration Tests**: Cross-platform path handling, preset configurations

### Integration Tests
- **MCP Protocol**: Complete protocol compliance, all 6 tools validation
- **End-to-End**: Full workflow from URL input to cached output
- **Cross-Platform**: Windows and Linux compatibility

### Manual Testing
- **Interactive MCP Client**: Real-time testing of MCP server responses
- **Protocol Debugging**: Direct JSON-RPC communication testing

## Test Features

- **170+ Test Cases**: Comprehensive coverage of all functionality
- **TypeScript Integration**: Full type safety with ts-jest
- **Mock Systems**: Python subprocess, file system, HTTP responses
- **Coverage Reporting**: HTML, LCOV, and console reports
- **Cross-Platform**: Tests for Windows and Linux compatibility
- **Performance Testing**: Timing, concurrency, and batch processing
- **Error Handling**: Network failures, timeouts, malformed data

## Running Tests

### Basic Testing
```bash
# Quick test run
npm test

# With coverage (generates coverage/ directory)
npm run test:coverage
```

### Development Testing
```bash
# Auto-rerun tests on file changes
npm run test:watch

# Test specific files
npm test tests/unit/cache.test.ts

# Verbose output for debugging
npm run test:verbose
```

### Manual Testing
```bash
# Interactive MCP protocol testing
npm run test:manual

# Then use commands like:
# crawl https://example.com
# list
# search test query
# quit
```

## Coverage Requirements

- **Target**: 60% coverage threshold (configurable in jest.config.js)
- **Scope**: All src/ TypeScript files except type definitions
- **Reports**: Generated in coverage/ directory

## Test Data

### fixtures/test-urls.json
Organized test URLs by category:
- Documentation sites (for docs preset testing)
- News/blog sites (for news preset testing)
- API documentation (for api preset testing)
- Fast sites (for HTTP strategy testing)
- Edge cases (error handling testing)

### fixtures/mock-responses.json
Mock HTTP responses for testing:
- Simple HTML responses
- JSON API responses
- Documentation pages
- Error responses (404, 500)

## Mocking Strategy

### Python Subprocess Mocking
- Mocks crawl4ai Python integration
- Simulates successful and failed scraping
- Tests timeout and error scenarios

### File System Mocking
- Cross-platform path testing
- Permission error simulation
- Cache corruption scenarios

### MCP Protocol Mocking
- Complete MCP server simulation
- Protocol compliance validation
- Tool response formatting

## Best Practices

1. **Test Organization**: Keep unit and integration tests separate
2. **Mock Strategy**: Mock external dependencies (Python, file system, network)
3. **Type Safety**: Use TypeScript throughout tests
4. **Coverage**: Aim for meaningful tests, not just coverage numbers
5. **Performance**: Test concurrent operations and timing
6. **Error Handling**: Test failure scenarios thoroughly

## Troubleshooting

### Common Issues

**TypeScript Errors**:
- Ensure test files import from correct paths
- Check that interfaces match actual exports

**Jest Configuration**:
- Verify tsconfig.test.json is used for test compilation
- Check jest.config.js for correct file patterns

**Coverage Failures**:
- Adjust thresholds in jest.config.js during development
- Focus on meaningful tests over coverage percentage

**Manual Testing Issues**:
- Ensure MCP server is built before running manual tests
- Check that Python dependencies are installed

### Getting Help

1. Check test output for specific error messages
2. Use `npm run test:verbose` for detailed information
3. Review individual test files for usage examples
4. Use manual testing for MCP protocol debugging