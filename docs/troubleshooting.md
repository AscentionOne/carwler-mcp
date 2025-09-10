# Crawl4AI Troubleshooting & Error Handling Guide

## Installation Issues

### Python Version Problems
```bash
# Check Python version (requires 3.10+)
python3 --version

# If version is too old, upgrade Python
sudo apt update && sudo apt install python3.10 python3.10-pip

# Or use conda
conda install python=3.10
```

### Playwright Browser Installation Issues
```bash
# Full setup sequence
pip install crawl4ai
crawl4ai-setup

# If setup fails, try manual browser installation
playwright install chromium
playwright install firefox

# Check if browsers are installed
playwright install --dry-run
```

### Permission Issues (Linux/WSL)
```bash
# Fix permission issues for browser execution
sudo apt install -y wget gnupg
sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2

# For WSL specifically
export DISPLAY=:0
```

### Docker Issues
```bash
# Increase shared memory for browser
docker run --shm-size=1g unclecode/crawl4ai:latest

# Check container logs
docker logs <container-id>

# Interactive debugging
docker run -it --shm-size=1g unclecode/crawl4ai:latest /bin/bash
```

## Common Runtime Errors

### Memory Issues

#### Error: "Browser crashed" or "Out of memory"
```python
# Solution: Configure memory-conscious settings
browser_config = BrowserConfig(
    headless=True,
    text_mode=True,  # Disable images
    extra_args=[
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--memory-pressure-off",
        "--max_old_space_size=4096"
    ]
)
```

#### Memory monitoring and cleanup
```python
from crawl4ai.memory_utils import MemoryMonitor, get_memory_info

monitor = MemoryMonitor()

async def memory_safe_crawl(urls):
    results = []
    
    for url in urls:
        # Check memory before each crawl
        memory_info = get_memory_info()
        if memory_info['percent'] > 80:  # 80% memory usage
            print("High memory usage, forcing cleanup...")
            import gc
            gc.collect()
        
        async with AsyncWebCrawler() as crawler:
            result = await crawler.arun(url)
            results.append(result)
    
    return results
```

### Network and Timeout Issues

#### Error: "Page timeout" or "Navigation timeout"
```python
config = CrawlerRunConfig(
    page_timeout=120000,  # 2 minutes
    delay_before_return_html=5000,  # 5 seconds
    wait_for="css:body",  # Wait for basic page structure
    js_code=["document.readyState === 'complete'"]
)
```

#### Network connectivity issues
```python
import aiohttp
import asyncio

async def check_url_accessibility(url):
    """Check if URL is accessible before crawling"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.head(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                return response.status < 400
    except:
        return False

# Usage
if await check_url_accessibility(url):
    result = await crawler.arun(url)
else:
    print(f"URL {url} is not accessible")
```

### Proxy Issues

#### Proxy authentication failures
```python
# Ensure proxy format is correct
proxy_config = ProxyConfig.from_string("http://username:password@proxy.example.com:8080")

# Test proxy connectivity
import requests

def test_proxy(proxy_string):
    try:
        proxies = {'http': proxy_string, 'https': proxy_string}
        response = requests.get('http://httpbin.org/ip', proxies=proxies, timeout=10)
        return response.status_code == 200
    except:
        return False
```

#### Proxy rotation issues
```python
from crawl4ai import ProxyRotationStrategy

# Add error handling to proxy rotation
rotation_strategy = ProxyRotationStrategy(
    proxies=proxies,
    rotation_method="round_robin",
    max_retries=3,  # Retry with different proxy on failure
    retry_delay=1   # Wait 1 second between retries
)
```

## Node.js Integration Issues

### Subprocess Communication Errors

#### Error: "Python process failed" or JSON parsing errors
```javascript
// Enhanced error handling for subprocess
class RobustCrawl4AIScraper extends Crawl4AIScraper {
    async scrapeUrl(url, config = {}) {
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await super.scrapeUrl(url, config);
            } catch (error) {
                console.error(`Attempt ${attempt}/${maxRetries} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    // Return a structured error response instead of throwing
                    return {
                        success: false,
                        error: `All attempts failed. Last error: ${error.message}`,
                        url: url,
                        status_code: 0,
                        markdown: ""
                    };
                }
                
                // Exponential backoff
                await new Promise(resolve => 
                    setTimeout(resolve, Math.pow(2, attempt) * 1000)
                );
            }
        }
    }
}
```

#### Python environment issues
```javascript
// Check Python environment before running
const { spawn } = require('child_process');

async function checkPythonEnvironment() {
    return new Promise((resolve) => {
        const process = spawn('python3', ['-c', 'import crawl4ai; print("OK")']);
        
        let stdout = '';
        process.stdout.on('data', (data) => stdout += data.toString());
        
        process.on('close', (code) => {
            resolve({
                available: code === 0,
                output: stdout.trim()
            });
        });
    });
}

// Usage
const envCheck = await checkPythonEnvironment();
if (!envCheck.available) {
    throw new Error('Crawl4AI Python environment not available');
}
```

### Process Management Issues

#### Zombie processes or hanging subprocesses
```javascript
class ProcessManager {
    constructor() {
        this.activeProcesses = new Set();
        
        // Cleanup on exit
        process.on('SIGINT', () => this.cleanup());
        process.on('SIGTERM', () => this.cleanup());
    }
    
    spawn(command, args) {
        const childProcess = spawn(command, args);
        this.activeProcesses.add(childProcess);
        
        childProcess.on('close', () => {
            this.activeProcesses.delete(childProcess);
        });
        
        return childProcess;
    }
    
    cleanup() {
        for (const process of this.activeProcesses) {
            if (!process.killed) {
                process.kill('SIGTERM');
            }
        }
        this.activeProcesses.clear();
    }
}

const processManager = new ProcessManager();

// Use in scraper
const process = processManager.spawn('python3', [scriptPath, url]);
```

## Performance Issues

### Slow Crawling

#### Optimize browser configuration
```python
# Performance-optimized browser config
browser_config = BrowserConfig(
    headless=True,
    text_mode=True,  # Skip image loading
    extra_args=[
        "--disable-extensions",
        "--disable-plugins",
        "--disable-images",
        "--disable-javascript",  # If JS not needed
        "--no-sandbox",
        "--disable-dev-shm-usage"
    ]
)
```

#### Optimize content selection
```python
# Target specific content to reduce processing
config = CrawlerRunConfig(
    css_selector="main, article, .post-content",  # Be specific
    excluded_tags=["script", "style", "nav", "footer", "aside", "header"],
    word_count_threshold=20,  # Skip very short content
    exclude_external_links=True,
    exclude_external_images=True
)
```

### High Resource Usage

#### Batch processing with memory management
```python
async def batch_crawl_with_memory_management(urls, batch_size=5):
    results = []
    
    for i in range(0, len(urls), batch_size):
        batch = urls[i:i + batch_size]
        print(f"Processing batch {i//batch_size + 1}: {len(batch)} URLs")
        
        # Process batch
        async with AsyncWebCrawler() as crawler:
            batch_results = await crawler.arun_many(
                batch, 
                config=CrawlerRunConfig(stream=True)  # Stream results
            )
            results.extend(batch_results)
        
        # Force garbage collection between batches
        import gc
        gc.collect()
        
        # Optional: brief pause between batches
        await asyncio.sleep(1)
    
    return results
```

## Debugging Tools

### Enable verbose logging
```python
import logging

# Enable detailed logging
logging.basicConfig(level=logging.DEBUG)

browser_config = BrowserConfig(verbose=True)
```

### Health check utilities
```python
async def health_check():
    """Comprehensive health check for Crawl4AI"""
    checks = []
    
    try:
        # Test basic crawling
        async with AsyncWebCrawler() as crawler:
            result = await crawler.arun("https://httpbin.org/html")
            checks.append(("Basic crawling", result.success))
    except Exception as e:
        checks.append(("Basic crawling", False, str(e)))
    
    try:
        # Test JavaScript execution
        config = CrawlerRunConfig(
            js_code=["document.title = 'Test';"],
            wait_for="js:() => document.title === 'Test'"
        )
        async with AsyncWebCrawler() as crawler:
            result = await crawler.arun("https://httpbin.org/html", config=config)
            checks.append(("JavaScript execution", result.success))
    except Exception as e:
        checks.append(("JavaScript execution", False, str(e)))
    
    return checks

# Run health check
checks = await health_check()
for check in checks:
    status = "✅" if check[1] else "❌"
    error = f" - {check[2]}" if len(check) > 2 else ""
    print(f"{status} {check[0]}{error}")
```

### Node.js integration testing
```javascript
// test/health-check.js
async function runHealthCheck() {
    const { Crawl4AIScraper } = require('../src/scraper');
    
    console.log('🔍 Running Crawl4AI Node.js integration health check...\n');
    
    const scraper = new Crawl4AIScraper({ timeout: 30000 });
    
    const tests = [
        {
            name: 'Basic HTTP site',
            url: 'https://httpbin.org/html',
            expectSuccess: true
        },
        {
            name: 'HTTPS site with modern JS',
            url: 'https://quotes.toscrape.com',
            expectSuccess: true
        },
        {
            name: 'Invalid URL',
            url: 'https://definitely-not-a-real-site-12345.com',
            expectSuccess: false
        }
    ];
    
    for (const test of tests) {
        try {
            console.log(`Testing: ${test.name}`);
            const result = await scraper.scrapeUrl(test.url);
            
            const success = result.success === test.expectSuccess;
            console.log(`${success ? '✅' : '❌'} ${test.name}`);
            
            if (result.success) {
                console.log(`   Status: ${result.status_code}`);
                console.log(`   Content: ${result.markdown.length} chars`);
            } else {
                console.log(`   Error: ${result.error}`);
            }
        } catch (error) {
            console.log(`❌ ${test.name} - Exception: ${error.message}`);
        }
        console.log('');
    }
}

runHealthCheck();
```

## Diagnostic Commands

### Installation verification
```bash
# Check Crawl4AI installation
crawl4ai-doctor

# Check Python environment
python3 -c "import crawl4ai; print('Crawl4AI version:', crawl4ai.__version__)"

# Check browser installation
python3 -c "from crawl4ai import AsyncWebCrawler; import asyncio; asyncio.run(AsyncWebCrawler().health_check())"

# Test basic crawling via CLI
crwl https://httpbin.org/html -o markdown
```

### System diagnostics
```bash
# Check system resources
free -h  # Memory usage
df -h    # Disk usage
top      # CPU usage

# Check browser processes
ps aux | grep chrome
ps aux | grep firefox

# Check Python processes
ps aux | grep python
```

## Common Error Patterns and Solutions

| Error Pattern | Cause | Solution |
|--------------|--------|----------|
| `Browser crashed` | Insufficient memory/resources | Use `text_mode=True`, increase `--shm-size` for Docker |
| `Navigation timeout` | Page loading too slowly | Increase `page_timeout`, add `wait_for` conditions |
| `JSON decode error` | Malformed subprocess output | Add output validation, handle encoding issues |
| `Permission denied` | Browser executable permissions | Fix file permissions, install missing system libraries |
| `Proxy authentication failed` | Incorrect proxy credentials | Verify proxy string format, test proxy separately |
| `Module not found` | Missing Python dependencies | Run `pip install crawl4ai` and `crawl4ai-setup` |
| `Port already in use` | Docker/server port conflict | Change port mapping, kill existing processes |

## Emergency Recovery

### Reset everything
```bash
# Complete clean reinstall
pip uninstall crawl4ai -y
rm -rf ~/.cache/ms-playwright
rm -rf ~/.cache/pip

pip install crawl4ai
crawl4ai-setup
playwright install
```

### Docker recovery
```bash
# Stop and remove all crawl4ai containers
docker stop $(docker ps -q --filter ancestor=unclecode/crawl4ai)
docker rm $(docker ps -aq --filter ancestor=unclecode/crawl4ai)

# Remove images and restart
docker rmi unclecode/crawl4ai
docker pull unclecode/crawl4ai:latest
```