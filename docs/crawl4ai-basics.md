# Crawl4AI Basics for Simple Web Scraping

## Installation
```bash
pip install crawl4ai
crawl4ai-setup  # Install browser dependencies
```

## Basic Usage (Python)
```python
import asyncio
from crawl4ai import AsyncWebCrawler

async def main():
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun("https://example.com")
        print(result.markdown[:300])  # Clean markdown output

if __name__ == "__main__":
    asyncio.run(main())
```

## Configuration Options
```python
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

# Browser config
browser_config = BrowserConfig(
    headless=True,           # Run in background
    viewport_width=1280,
    viewport_height=720
)

# Crawl config  
run_config = CrawlerRunConfig(
    cache_mode=CacheMode.BYPASS,  # Fresh content
    css_selector="main.content",  # Focus on main content
    excluded_tags=["nav", "footer"],  # Remove navigation
    word_count_threshold=10       # Filter short content
)

async with AsyncWebCrawler(config=browser_config) as crawler:
    result = await crawler.arun(url="https://example.com", config=run_config)
    print(result.markdown)
```

## Key Properties of Result
- `result.markdown` - Clean markdown content
- `result.success` - Boolean success status
- `result.status_code` - HTTP status
- `result.url` - Final URL after redirects
- `result.cleaned_html` - Cleaned HTML

## Error Handling
```python
async with AsyncWebCrawler() as crawler:
    result = await crawler.arun("https://example.com")
    if result.success:
        print(result.markdown)
    else:
        print(f"Failed: {result.error_message}")
```

## CLI Usage
```bash
# Basic crawl
crwl https://example.com

# Get markdown output  
crwl https://example.com -o markdown
```