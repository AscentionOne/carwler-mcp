# Node.js + Crawl4AI Integration Strategy

## Approach: Python Subprocess from Node.js

Since Crawl4AI is a Python library, we'll use it via subprocess calls from Node.js.

## Implementation Pattern

### 1. Python Wrapper Script
Create a simple Python script that takes URL as argument and outputs markdown:

```python
#!/usr/bin/env python3
# scripts/scrape.py
import asyncio
import sys
import json
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

async def scrape_url(url):
    try:
        browser_config = BrowserConfig(headless=True)
        run_config = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            css_selector="main, article, .content",
            excluded_tags=["nav", "footer", "aside", "script", "style"],
            word_count_threshold=10
        )
        
        async with AsyncWebCrawler(config=browser_config) as crawler:
            result = await crawler.arun(url=url, config=run_config)
            
            return {
                "success": result.success,
                "markdown": result.markdown,
                "url": result.url,
                "status_code": result.status_code,
                "error": result.error_message if not result.success else None
            }
    except Exception as e:
        return {
            "success": False,
            "markdown": "",
            "url": url,
            "status_code": 0,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: scrape.py <url>"}))
        sys.exit(1)
    
    url = sys.argv[1]
    result = asyncio.run(scrape_url(url))
    print(json.dumps(result, indent=2))
```

### 2. Node.js Integration
```javascript
// src/scraper.js
const { spawn } = require('child_process');
const path = require('path');

async function scrapeUrl(url) {
    return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, '../scripts/scrape.py');
        const process = spawn('python3', [pythonScript, url]);
        
        let stdout = '';
        let stderr = '';
        
        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        process.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python process failed: ${stderr}`));
                return;
            }
            
            try {
                const result = JSON.parse(stdout);
                resolve(result);
            } catch (e) {
                reject(new Error(`Failed to parse result: ${e.message}`));
            }
        });
    });
}

module.exports = { scrapeUrl };
```

## Benefits of This Approach
- Simple integration with existing Python ecosystem
- No need to rewrite Crawl4AI functionality
- Easy to maintain and update
- Leverages Crawl4AI's advanced features (browser automation, content cleaning)
- JSON communication between Node.js and Python

## Installation Requirements
```bash
# Python requirements
pip install crawl4ai
crawl4ai-setup

# Node.js requirements  
npm install # (no additional deps needed for subprocess approach)
```