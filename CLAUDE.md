# Claude Web Crawler MCP Agent - Project Context

## Project Overview
Universal cross-platform MCP server enabling Claude Code to scrape web documentation and generate LLM-friendly markdown files using crawl4ai.

## Key Details
- **Language**: Node.js + TypeScript (runtime), Python (crawl4ai subprocess)
- **Protocol**: MCP (Model Context Protocol)
- **Target Platforms**: Windows, Linux
- **Distribution**: Global npm package
- **Goal**: Free, zero-config documentation scraping for Claude Code

## Architecture
```
src/
├── index.ts          # MCP server entry point
├── crawler.ts        # crawl4ai integration
├── storage.ts        # Cross-platform file management
├── config.ts         # OS detection & configuration
└── utils.ts          # Helper functions
```

## Core Commands
- `crawl-url`: Single page scraping
- `crawl-docs`: Deep documentation crawling
- `get-cached`, `search-cache`, `list-cache`: Cache management
- `update-cache`, `clear-cache`: Cache maintenance

## Storage Strategy
- Windows: `C:\Users\{user}\.claude\crawled_docs\`
- Linux: `~/.claude/crawled_docs/`

## Development Environment
- **Current Development**: Ubuntu 20.04.6 LTS (WSL2)
- **Development Tools**: Node.js + TypeScript, Python (crawl4ai)

## Development Rules
- **Commits**: Professional messages without Claude references
- **Testing**: 90%+ coverage, cross-platform validation
- **Performance**: <5s single page crawl, <512MB memory
- **Code Style**: TypeScript strict mode, ESLint + Prettier

## Session Management
- **New Session**: Always read the following documents to understand current state:
  - `SESSION_SUMMARY.md`: Previous progress and current status
  - `IMPLEMENTATION_PLAN.md`: Technical architecture and phase details
  - `TASKS.md`: Current task status and checklist progress
- **Session End**: Update `SESSION_SUMMARY.md` with:
  - Timestamp and date of session
  - Completed work with specific outcomes
  - Key learning insights and design decisions
  - Next steps and immediate goals
  - Time investment estimates for future work

## Progress Tracking
Read and update TASKS.md checkbox status when completing work. Mark tasks as ✅ when finished.

## Reference Documents
- `PRD.md`: Complete requirements and user stories
- `IMPLEMENTATION_PLAN.md`: Technical architecture and phases
- `TASKS.md`: Detailed development checklist
- `SESSION_SUMMARY.md`: Progress log across sessions

## Learning-by-Doing Approach
This project follows a **learn-by-doing methodology**. When implementing features or making changes:

- **Explain the Process**: Detail why specific approaches are chosen over alternatives
- **Concept Education**: Break down design patterns, architectural decisions, and best practices
- **Function Purpose**: Clarify what each function achieves and how it fits the broader system
- **Trade-off Analysis**: Discuss pros/cons of implementation choices
- **Progressive Enhancement**: Show how code evolves from basic to robust implementations

**Always provide educational context** for design decisions, coding patterns, and architectural choices to support hands-on learning.

## Current Focus
Building Phase 1 foundation: project setup, TypeScript config, MCP integration, cross-platform utilities.
- commit with professional commit message and to not include claude message