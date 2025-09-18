# Node.js + Crawl4AI Integration Patterns

## Overview
Since Crawl4AI is a Python library, this guide covers proven patterns for integrating it with Node.js applications through subprocess execution.

## Method 1: Simple Subprocess Integration

### Python Wrapper Script
Create `scripts/scrape.py`:

```python
#!/usr/bin/env python3
import asyncio
import sys
import json
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

async def scrape_url(url, config=None):
    try:
        # Default browser configuration
        browser_config = BrowserConfig(
            headless=True,
            viewport_width=1280,
            viewport_height=720
        )
        
        # Default crawler configuration for clean markdown
        run_config = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            css_selector="main, article, .content, #content",
            excluded_tags=["nav", "footer", "aside", "script", "style", "noscript"],
            word_count_threshold=10,
            exclude_external_links=True,
            exclude_social_media_links=True
        )
        
        # Override with custom config if provided
        if config:
            if 'css_selector' in config:
                run_config.css_selector = config['css_selector']
            if 'excluded_tags' in config:
                run_config.excluded_tags = config['excluded_tags']
            if 'word_count_threshold' in config:
                run_config.word_count_threshold = config['word_count_threshold']
        
        async with AsyncWebCrawler(config=browser_config) as crawler:
            result = await crawler.arun(url=url, config=run_config)
            
            return {
                "success": result.success,
                "markdown": result.markdown,
                "url": result.url,
                "status_code": result.status_code,
                "title": getattr(result, 'title', ''),
                "error": result.error_message if not result.success else None
            }
            
    except Exception as e:
        return {
            "success": False,
            "markdown": "",
            "url": url,
            "status_code": 0,
            "title": "",
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: scrape.py <url> [config_json]"}))
        sys.exit(1)
    
    url = sys.argv[1]
    config = None
    
    if len(sys.argv) > 2:
        try:
            config = json.loads(sys.argv[2])
        except json.JSONDecodeError:
            print(json.dumps({"error": "Invalid JSON config"}))
            sys.exit(1)
    
    result = asyncio.run(scrape_url(url, config))
    print(json.dumps(result, indent=2, ensure_ascii=False))
```

### Node.js Integration Module
Create `src/scraper.js`:

```javascript
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class Crawl4AIScraper {
    constructor(options = {}) {
        this.pythonPath = options.pythonPath || 'python3';
        this.scriptPath = options.scriptPath || path.join(__dirname, '../scripts/scrape.py');
        this.timeout = options.timeout || 30000; // 30 seconds
    }

    async scrapeUrl(url, config = {}) {
        return new Promise((resolve, reject) => {
            const args = [this.scriptPath, url];
            
            // Add config as JSON string if provided
            if (Object.keys(config).length > 0) {
                args.push(JSON.stringify(config));
            }

            const process = spawn(this.pythonPath, args);
            
            let stdout = '';
            let stderr = '';
            
            // Set up timeout
            const timer = setTimeout(() => {
                process.kill('SIGTERM');
                reject(new Error(`Scraping timeout after ${this.timeout}ms`));
            }, this.timeout);

            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            process.on('close', (code) => {
                clearTimeout(timer);
                
                if (code !== 0) {
                    reject(new Error(`Python process failed (code ${code}): ${stderr}`));
                    return;
                }

                try {
                    const result = JSON.parse(stdout);
                    resolve(result);
                } catch (e) {
                    reject(new Error(`Failed to parse result: ${e.message}\nOutput: ${stdout}`));
                }
            });

            process.on('error', (error) => {
                clearTimeout(timer);
                reject(new Error(`Failed to spawn Python process: ${error.message}`));
            });
        });
    }

    async scrapeMultiple(urls, config = {}, concurrency = 3) {
        const results = [];
        const batches = [];
        
        // Create batches for controlled concurrency
        for (let i = 0; i < urls.length; i += concurrency) {
            batches.push(urls.slice(i, i + concurrency));
        }

        for (const batch of batches) {
            const batchPromises = batch.map(url => 
                this.scrapeUrl(url, config).catch(error => ({
                    success: false,
                    error: error.message,
                    url: url
                }))
            );
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        return results;
    }

    // Health check method
    async checkHealth() {
        try {
            const result = await this.scrapeUrl('https://httpbin.org/html', {
                word_count_threshold: 1
            });
            return result.success;
        } catch (error) {
            return false;
        }
    }
}

module.exports = { Crawl4AIScraper };
```

### Usage Examples

```javascript
const { Crawl4AIScraper } = require('./src/scraper');

async function example() {
    const scraper = new Crawl4AIScraper({
        timeout: 60000 // 60 seconds
    });

    // Basic scraping
    try {
        const result = await scraper.scrapeUrl('https://example.com');
        
        if (result.success) {
            console.log('Title:', result.title);
            console.log('Status:', result.status_code);
            console.log('Content length:', result.markdown.length);
            console.log('Preview:', result.markdown.substring(0, 200));
        } else {
            console.error('Scraping failed:', result.error);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Scraping with custom configuration
    const customConfig = {
        css_selector: 'main.article-content',
        excluded_tags: ['nav', 'footer', 'aside', 'script'],
        word_count_threshold: 50
    };

    const result2 = await scraper.scrapeUrl('https://news.ycombinator.com', customConfig);

    // Multiple URLs
    const urls = [
        'https://example.com',
        'https://httpbin.org/html',
        'https://quotes.toscrape.com'
    ];

    const results = await scraper.scrapeMultiple(urls, {}, 2); // 2 concurrent
    console.log(`Scraped ${results.length} URLs`);
}

example();
```

## Method 2: Express.js API Integration

```javascript
const express = require('express');
const { Crawl4AIScraper } = require('./src/scraper');

const app = express();
const scraper = new Crawl4AIScraper();

app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
    const isHealthy = await scraper.checkHealth();
    res.json({ 
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString()
    });
});

// Single URL scraping
app.post('/scrape', async (req, res) => {
    const { url, config = {} } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const result = await scraper.scrapeUrl(url, config);
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message,
            url: url
        });
    }
});

// Multiple URLs scraping
app.post('/scrape/batch', async (req, res) => {
    const { urls, config = {}, concurrency = 3 } = req.body;

    if (!Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ error: 'URLs array is required' });
    }

    try {
        const results = await scraper.scrapeMultiple(urls, config, concurrency);
        
        const summary = {
            total: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
        };

        res.json({ summary, results });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message
        });
    }
});

app.listen(3000, () => {
    console.log('Crawler API running on port 3000');
});
```

## Method 3: With Simple Caching

```javascript
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class CachedCrawl4AIScraper extends Crawl4AIScraper {
    constructor(options = {}) {
        super(options);
        this.cacheDir = options.cacheDir || path.join(__dirname, '../cache');
        this.cacheTTL = options.cacheTTL || 3600000; // 1 hour in ms
    }

    async ensureCacheDir() {
        try {
            await fs.access(this.cacheDir);
        } catch {
            await fs.mkdir(this.cacheDir, { recursive: true });
        }
    }

    getCacheKey(url, config) {
        const combined = JSON.stringify({ url, config });
        return crypto.createHash('md5').update(combined).digest('hex');
    }

    getCacheFilePath(cacheKey) {
        return path.join(this.cacheDir, `${cacheKey}.json`);
    }

    async getCachedResult(url, config) {
        await this.ensureCacheDir();
        
        const cacheKey = this.getCacheKey(url, config);
        const cacheFile = this.getCacheFilePath(cacheKey);

        try {
            const stats = await fs.stat(cacheFile);
            const age = Date.now() - stats.mtime.getTime();

            if (age < this.cacheTTL) {
                const cached = await fs.readFile(cacheFile, 'utf8');
                return JSON.parse(cached);
            }
        } catch {
            // Cache miss or error, continue to scrape
        }

        return null;
    }

    async setCachedResult(url, config, result) {
        await this.ensureCacheDir();
        
        const cacheKey = this.getCacheKey(url, config);
        const cacheFile = this.getCacheFilePath(cacheKey);

        await fs.writeFile(cacheFile, JSON.stringify(result, null, 2));
    }

    async scrapeUrl(url, config = {}) {
        // Try cache first
        const cached = await this.getCachedResult(url, config);
        if (cached) {
            return { ...cached, fromCache: true };
        }

        // Scrape and cache
        const result = await super.scrapeUrl(url, config);
        
        if (result.success) {
            await this.setCachedResult(url, config, result);
        }

        return { ...result, fromCache: false };
    }

    async clearCache() {
        await this.ensureCacheDir();
        const files = await fs.readdir(this.cacheDir);
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                await fs.unlink(path.join(this.cacheDir, file));
            }
        }
    }
}

module.exports = { CachedCrawl4AIScraper };
```

## Error Handling Best Practices

```javascript
async function robustScrape(url, maxRetries = 3) {
    const scraper = new Crawl4AIScraper({ timeout: 60000 });
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt}/${maxRetries} for ${url}`);
            
            const result = await scraper.scrapeUrl(url);
            
            if (result.success) {
                return result;
            }
            
            // If not successful but no exception, log and retry
            console.warn(`Attempt ${attempt} failed: ${result.error}`);
            
            if (attempt === maxRetries) {
                return result; // Return the failed result on final attempt
            }
            
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            
        } catch (error) {
            console.error(`Attempt ${attempt} error:`, error.message);
            
            if (attempt === maxRetries) {
                return {
                    success: false,
                    error: `All ${maxRetries} attempts failed. Last error: ${error.message}`,
                    url: url,
                    status_code: 0,
                    markdown: ""
                };
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}
```

## Installation Requirements

```bash
# Python requirements
pip install crawl4ai
crawl4ai-setup

# Node.js project setup
npm init -y
npm install express  # if using Express.js API

# Make Python script executable
chmod +x scripts/scrape.py
```

## Testing the Integration

```javascript
// test/integration.test.js
const { Crawl4AIScraper } = require('../src/scraper');

async function testIntegration() {
    console.log('Testing Crawl4AI Node.js integration...');
    
    const scraper = new Crawl4AIScraper();
    
    // Test basic functionality
    const result = await scraper.scrapeUrl('https://httpbin.org/html');
    
    console.log('Success:', result.success);
    console.log('Status Code:', result.status_code);
    console.log('Content Length:', result.markdown?.length || 0);
    
    if (result.success) {
        console.log('✅ Integration test passed');
    } else {
        console.log('❌ Integration test failed:', result.error);
    }
}

testIntegration();
```