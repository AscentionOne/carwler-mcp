# TypeScript Best Practices for Web Crawler Project

## Overview
This document contains TypeScript best practices and configuration guidelines compiled from official Microsoft TypeScript documentation. These practices will be applied during the Phase 1 TypeScript migration.

## TypeScript Configuration (tsconfig.json)

### Recommended Configuration for Node.js Projects
```json
{
  "compilerOptions": {
    "target": "ES2016",                          // Modern JS features, widely supported
    "module": "CommonJS",                        // Node.js standard module system
    "outDir": "./dist",                          // Compiled JS output directory  
    "rootDir": "./src",                          // Source TypeScript files location
    "strict": true,                              // Enable all strict type checking
    "esModuleInterop": true,                     // Better CommonJS/ES module compatibility
    "skipLibCheck": true,                        // Skip type checking of declaration files
    "forceConsistentCasingInFileNames": true,    // Prevent casing issues across platforms
    "declaration": true,                         // Generate .d.ts files for library usage
    "declarationMap": true,                      // Enable sourcemaps for .d.ts files
    "sourceMap": true,                           // Generate sourcemaps for debugging
    "resolveJsonModule": true,                   // Allow importing JSON files
    "allowSyntheticDefaultImports": true         // Allow default imports from modules
  },
  "include": [
    "src/**/*.ts",                               // Include all TypeScript files in src
    "test/**/*.ts"                               // Include test files
  ],
  "exclude": [
    "node_modules",                              // Exclude dependencies
    "dist",                                      // Exclude build output
    "**/*.spec.ts"                               // Exclude test files from main build
  ]
}
```

### Key Configuration Options Explained

**Target & Module**
- `target: "ES2016"`: Provides modern JavaScript features while maintaining broad compatibility
- `module: "CommonJS"`: Standard for Node.js applications

**Strict Type Checking**
- `strict: true`: Enables all strict type checking options, including:
  - `noImplicitAny`: Error on expressions with implied 'any' type
  - `strictNullChecks`: Include 'null' and 'undefined' in type checking
  - `strictFunctionTypes`: Check function types more carefully
  - `strictPropertyInitialization`: Ensure properties are initialized

**Module Resolution**
- `esModuleInterop: true`: Fixes import issues between CommonJS and ES modules
- `allowSyntheticDefaultImports: true`: Better import experience
- `resolveJsonModule: true`: Allow importing JSON configuration files

**Development Experience**  
- `declaration: true`: Generate type definition files for library consumption
- `sourceMap: true`: Enable debugging support in IDEs
- `skipLibCheck: true`: Faster compilation by skipping type checking of .d.ts files

## Interface Design Best Practices

### 1. Prefer Interfaces Over Type Aliases for Object Shapes
```typescript
// ✅ Good - Use interface for object shapes
interface ScrapeResult {
  success: boolean;
  markdown: string;
  url: string;
  status_code: number;
  title: string;
  content_length: number;
  error: string | null;
}

// ❌ Avoid - Type alias for simple object shapes
type ScrapeResult = {
  success: boolean;
  // ... other properties
}
```

### 2. Use Interface Extension for Code Organization
```typescript
// ✅ Good - Extend interfaces for related concepts
interface BaseConfig {
  timeout: number;
  verbose: boolean;
}

interface CrawlerConfig extends BaseConfig {
  css_selector?: string;
  excluded_tags?: string[];
  word_count_threshold?: number;
  page_timeout?: number;
}
```

### 3. Optional Properties and Default Values
```typescript
// ✅ Good - Mark optional properties clearly
interface CrawlerOptions {
  pythonPath?: string;          // Optional with sensible default
  timeout?: number;             // Optional with sensible default
  outputFile?: string;          // Optional, no default needed
  verbose?: boolean;            // Optional with default false
}

// ✅ Good - Document defaults in implementation
class SimpleCrawler {
  constructor(options: CrawlerOptions = {}) {
    this.pythonPath = options.pythonPath || 'python3.11';
    this.timeout = options.timeout || 60000;
    this.verbose = options.verbose || false;
    this.outputFile = options.outputFile || null;
  }
}
```

### 4. Generic Interfaces for Reusability
```typescript
// ✅ Good - Generic interface for flexible APIs
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
  timestamp: string;
}

// Usage with specific data types
type ScrapeResponse = ApiResponse<ScrapeResult>;
type ConfigResponse = ApiResponse<CrawlerConfig>;
```

## Function Type Signatures

### 1. Explicit Return Types for Public APIs
```typescript
// ✅ Good - Explicit return type for main API functions
async scrapeUrl(url: string, config: CrawlerConfig = {}): Promise<ScrapeResult> {
  // Implementation
}

// ✅ Good - Explicit return type prevents accidental changes
formatResult(result: ScrapeResult): string {
  // Implementation
}
```

### 2. Parameter Type Safety
```typescript
// ✅ Good - Use union types for constrained options
type LogLevel = 'info' | 'success' | 'error' | 'warn';

log(message: string, type: LogLevel = 'info'): void {
  // Type-safe implementation
}

// ✅ Good - Use readonly for immutable parameters
processResults(results: readonly ScrapeResult[]): Summary {
  // Cannot accidentally modify the input array
}
```

## Error Handling Patterns

### 1. Result Pattern for Predictable Errors
```typescript
// ✅ Good - Structured error handling without exceptions
interface ScrapeResult {
  success: boolean;
  data?: {
    markdown: string;
    url: string;
    title: string;
    // ... other success data
  };
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
}

// Usage
const result = await scraper.scrapeUrl(url);
if (result.success) {
  console.log(result.data.markdown);  // TypeScript knows data exists
} else {
  console.error(result.error.message); // TypeScript knows error exists
}
```

### 2. Custom Error Types
```typescript
// ✅ Good - Specific error types for different failure modes
interface ValidationError {
  type: 'validation';
  field: string;
  message: string;
}

interface NetworkError {
  type: 'network';
  statusCode?: number;
  message: string;
}

interface CrawlerError {
  type: 'crawler';
  pythonError?: string;
  message: string;
}

type ScrapeError = ValidationError | NetworkError | CrawlerError;
```

## Module Organization

### 1. Barrel Exports for Clean Imports
```typescript
// src/types/index.ts - Central type definitions
export interface ScrapeResult { /* ... */ }
export interface CrawlerConfig { /* ... */ }
export interface CrawlerOptions { /* ... */ }
export type ScrapeError = ValidationError | NetworkError | CrawlerError;

// src/index.ts - Main module exports  
export { SimpleCrawler } from './crawler';
export type { ScrapeResult, CrawlerConfig, CrawlerOptions } from './types';
```

### 2. Separate Interface Definitions
```typescript
// types.ts - Interface definitions
export interface ScrapeResult {
  success: boolean;
  markdown: string;
  url: string;
  status_code: number;
  title: string;
  content_length: number;
  error: string | null;
}

export interface CrawlerConfig {
  css_selector?: string;
  excluded_tags?: string[];
  word_count_threshold?: number;
  page_timeout?: number;
}

// crawler.ts - Implementation
import type { ScrapeResult, CrawlerConfig } from './types';

export class SimpleCrawler {
  async scrapeUrl(url: string, config?: CrawlerConfig): Promise<ScrapeResult> {
    // Implementation uses imported types
  }
}
```

## Development Workflow

### 1. NPM Scripts for TypeScript
```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch", 
    "dev": "tsc --watch & nodemon dist/index.js",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  }
}
```

### 2. IDE Configuration
- Enable TypeScript strict mode in your editor
- Configure auto-imports to prefer named imports
- Set up auto-formatting with Prettier
- Enable ESLint with TypeScript rules

## Performance Considerations

### 1. Compilation Performance
- Use `skipLibCheck: true` to skip checking node_modules types
- Use `incremental: true` for faster subsequent builds
- Consider `isolatedModules: true` for better build tool integration

### 2. Runtime Performance
- TypeScript types are erased at runtime - no performance impact
- Use `const assertions` for better type inference:
  ```typescript
  const logLevels = ['info', 'warn', 'error'] as const;
  type LogLevel = typeof logLevels[number]; // 'info' | 'warn' | 'error'
  ```

## Migration Strategy for Existing JavaScript

### 1. Gradual Migration Approach
1. Add `tsconfig.json` with `allowJs: true`
2. Rename one file at a time from `.js` to `.ts`
3. Add type annotations incrementally
4. Start with interfaces for main data structures
5. Add function signatures for public APIs
6. Gradually remove `any` types

### 2. Type Safety Levels
```typescript
// Level 1: Basic types
let url: string;
let timeout: number;

// Level 2: Interface usage
interface Config {
  timeout: number;
}

// Level 3: Generic constraints
function process<T extends ScrapeResult>(data: T): T {
  return data;
}

// Level 4: Advanced type manipulation
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];
```

## Benefits for This Project

### 1. Immediate Developer Experience Improvements
- **IntelliSense**: Auto-completion for `result.success`, `result.markdown`, etc.
- **Compile-time Error Detection**: Catch typos and type mismatches before runtime
- **Refactoring Safety**: Rename properties and functions with confidence
- **Documentation**: Types serve as living documentation

### 2. Maintainability Benefits
- **Interface Contracts**: Clear API boundaries between Python and Node.js
- **Test Safety**: Type-safe test data and assertions
- **Future-proofing**: Easier to add features with type safety guarantees

### 3. Foundation for Phase 2/3
- **MCP Integration**: Type-safe protocol implementation
- **API Expansion**: Structured approach to adding new commands
- **Team Collaboration**: Clear interfaces for multiple contributors

This TypeScript setup will transform the developer experience from guessing what properties are available to having comprehensive auto-completion and compile-time verification of all API interactions.