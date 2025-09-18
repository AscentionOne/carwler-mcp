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
- **Current Development**: Ubuntu 20.04.6 LST (WSL2)
- **Development Tools**: Node.js + TypeScript, Python (crawl4ai)
- **Python Version**: Always use `python3.11` (WSL2 has multiple Python versions)

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

## Documentation Management Rules

### File Purposes & Context Efficiency
- **SESSION_SUMMARY.md**: Current session progress + immediate next steps (keep <100 lines)
- **IMPLEMENTATION_PLAN.md**: Project architecture + current capabilities (update incrementally)  
- **TASKS.md**: Pure checklist progress (mark ✅/❌ only)

### Update Strategy (Minimize Context Usage)
1. **During Session**: Update only SESSION_SUMMARY.md with current progress
2. **Session End**: 
   - Consolidate completed work into IMPLEMENTATION_PLAN.md
   - Update TASKS.md checkboxes
   - Clean SESSION_SUMMARY.md for next session (keep <100 lines)

### Context Window Optimization
- **Session Start**: Read only SESSION_SUMMARY.md (not all 3 files) - saves 20-25k tokens
- **Architecture Details**: Read IMPLEMENTATION_PLAN.md only when specific technical details needed
- **Task Status**: Read TASKS.md only when reviewing overall project progress
- **Redundancy Prevention**: No code blocks or implementation details in SESSION_SUMMARY.md

### Documentation Content Rules
- **SESSION_SUMMARY.md**: Session-focused, no technical implementation details
- **IMPLEMENTATION_PLAN.md**: Architecture-focused, no session-specific progress
- **TASKS.md**: Checklist-focused, no implementation details or session history

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
Phase 2A Parallel Processing Enhancement: Completed v0.7.x API compliance and TypeScript batch processing integration. Next: CLI enhancement and testing.
- commit with professional commit message and to not include claude message
- when using context7 to search for crawl4ai always search on unclecode/crawl4ai