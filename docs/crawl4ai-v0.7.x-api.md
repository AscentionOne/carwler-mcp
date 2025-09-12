# Crawl4AI v0.7.x API Documentation

**Document Purpose**: Latest v0.7.x API reference for adaptive crawling and modern async features  
**Source**: Official Crawl4AI documentation via Context7  
**Date**: September 11, 2025  
**Version**: v0.7.4+

This document contains the latest v0.7.x API documentation showing the new adaptive crawling features and updated async interfaces.

## Key Changes in v0.7.x

### Major API Updates
1. **Adaptive Crawling**: New `AdaptiveCrawler` with intelligent content discovery
2. **Enhanced arun_many()**: Native batch processing with dispatchers
3. **Memory Management**: `MemoryAdaptiveDispatcher` for resource control
4. **Streaming Support**: Real-time processing capabilities
5. **Advanced Configuration**: URL-specific configurations and matching

## Core APIs

### 1. AsyncWebCrawler.arun_many() - Native Batch Processing

The main method for processing multiple URLs concurrently:

```python
async def arun_many(
    self,
    urls: List[str],
    config: Optional[CrawlerRunConfig] = None,
    dispatcher: Optional[BaseDispatcher] = None
) -> List[CrawlResult]:
    """
    Process multiple URLs with intelligent rate limiting and resource monitoring.
    """
```

#### Basic Usage
```python
# Minimal batch processing
results = await crawler.arun_many(
    urls=["https://site1.com", "https://site2.com"],
    config=CrawlerRunConfig(stream=False)  # Default behavior
)

for res in results:
    if res.success:
        print(res.url, "crawled OK!")
    else:
        print("Failed:", res.url, "-", res.error_message)
```

#### Advanced Usage with Custom Dispatcher
```python
dispatcher = MemoryAdaptiveDispatcher(
    memory_threshold_percent=70.0,
    max_session_permit=10
)
results = await crawler.arun_many(
    urls=["https://site1.com", "https://site2.com", "https://site3.com"],
    config=my_run_config,
    dispatcher=dispatcher
)
```

### 2. MemoryAdaptiveDispatcher - Resource Management

Automatically manages concurrency based on system memory usage:

#### Basic Configuration
```python
from crawl4ai import MemoryAdaptiveDispatcher, CrawlerMonitor

dispatcher = MemoryAdaptiveDispatcher(
    memory_threshold_percent=80.0,  # Pause if memory exceeds 80%
    check_interval=0.5,             # Check memory every 0.5 seconds
    max_session_permit=10,          # Maximum concurrent tasks
    monitor=CrawlerMonitor(
        max_visible_rows=15,
        display_mode=DisplayMode.DETAILED
    )
)
```

#### Advanced Configuration with Rate Limiting
```python
memory_dispatcher = MemoryAdaptiveDispatcher(
    memory_threshold_percent=85.0,      # Higher memory tolerance
    check_interval=0.5,                 # Check memory more frequently
    max_session_permit=20,              # More concurrent tasks
    memory_wait_timeout=600.0,          # Wait longer for memory
    rate_limiter=RateLimiter(
        base_delay=(0.5, 1.5),
        max_delay=30.0,
        max_retries=5
    ),
    monitor=CrawlerMonitor(
        max_visible_rows=15,
        display_mode=DisplayMode.AGGREGATED  # Summary view
    )
)
```

### 3. Batch vs Streaming Modes

#### Batch Mode (Default)
```python
async def crawl_batch():
    browser_config = BrowserConfig(headless=True, verbose=False)
    run_config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        stream=False  # Default: get all results at once
    )
    
    dispatcher = MemoryAdaptiveDispatcher(
        memory_threshold_percent=70.0,
        check_interval=1.0,
        max_session_permit=10,
        monitor=CrawlerMonitor(
            display_mode=DisplayMode.DETAILED
        )
    )

    async with AsyncWebCrawler(config=browser_config) as crawler:
        # Get all results at once
        results = await crawler.arun_many(
            urls=urls,
            config=run_config,
            dispatcher=dispatcher
        )
        
        # Process all results after completion
        for result in results:
            if result.success:
                await process_result(result)
            else:
                print(f"Failed to crawl {result.url}: {result.error_message}")
```

#### Streaming Mode
```python
async def stream_mode():
    async with AsyncWebCrawler() as crawler:
        # Process results as they become available
        async for result in await crawler.arun_many(
            urls=["https://docs.crawl4ai.com", "https://github.com/unclecode/crawl4ai"],
            config=CrawlerRunConfig(stream=True),
            dispatcher=dispatcher,
        ):
            print(f"Crawled: {result.url} with status code: {result.status_code}")
```

### 4. Large-Scale Crawling

For thousands of URLs with memory efficiency:

```python
async def large_scale_crawl():
    # For thousands of URLs
    urls = load_urls_from_file("large_url_list.txt")  # 10,000+ URLs
    
    dispatcher = MemoryAdaptiveDispatcher(
        memory_threshold_percent=70.0,  # Conservative memory usage
        max_session_permit=25,          # Higher concurrency
        rate_limiter=RateLimiter(
            base_delay=(0.1, 0.5),      # Faster for large batches
            max_retries=2               # Fewer retries for speed
        ),
        monitor=CrawlerMonitor(display_mode=DisplayMode.AGGREGATED)
    )
    
    config = CrawlerRunConfig(
        cache_mode=CacheMode.ENABLED,   # Use caching for efficiency
        stream=True,                    # Stream for memory efficiency
        word_count_threshold=100,       # Skip short content
        exclude_external_links=True     # Reduce processing overhead
    )
    
    successful_crawls = 0
    failed_crawls = 0
    
    async with AsyncWebCrawler() as crawler:
        async for result in await crawler.arun_many(
            urls=urls,
            config=config,
            dispatcher=dispatcher
        ):
            if result.success:
                successful_crawls += 1
                await save_result_to_database(result)
            else:
                failed_crawls += 1
                await log_failure(result.url, result.error_message)
            
            # Progress reporting
            if (successful_crawls + failed_crawls) % 100 == 0:
                print(f"Progress: {successful_crawls + failed_crawls}/{len(urls)}")
    
    print(f"Completed: {successful_crawls} successful, {failed_crawls} failed")
```

## New Feature: Adaptive Crawling

### AdaptiveCrawler - Intelligent Content Discovery

```python
from crawl4ai import AsyncWebCrawler, AdaptiveCrawler, AdaptiveConfig

async def main():
    async with AsyncWebCrawler() as crawler:
        # Create an adaptive crawler (config is optional)
        adaptive = AdaptiveCrawler(crawler)
        
        # Start crawling with a query
        result = await adaptive.digest(
            start_url="https://docs.python.org/3/",
            query="async context managers"
        )
        
        # View statistics
        adaptive.print_stats()
        
        # Get the most relevant content
        relevant_pages = adaptive.get_relevant_content(top_k=5)
        for page in relevant_pages:
            print(f"- {page['url']} (score: {page['score']:.2f})")
```

#### Advanced Configuration
```python
# Choose your strategy
config = AdaptiveConfig(
    strategy="embedding",  # or "statistical"
    embedding_min_confidence_threshold=0.1,  # Stop if irrelevant
    confidence_threshold=0.85,  # Higher threshold for completeness
    max_pages=30
)

adaptive = AdaptiveCrawler(crawler, config)

# Watch intelligence at work
result = await adaptive.digest(
    start_url="https://your-docs.com",
    query="your users' actual questions"
)

# See the efficiency
adaptive.print_stats()
print(f"Found {adaptive.confidence:.0%} of needed information")
print(f"In just {len(result.crawled_urls)} pages")
print(f"Saving you {1000 - len(result.crawled_urls)} unnecessary crawls")
```

## Advanced Features

### URL-Specific Configurations

Apply different configurations based on URL patterns:

```python
from crawl4ai import CrawlerRunConfig, MatchMode
from crawl4ai.processors.pdf import PDFContentScrapingStrategy
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy
from crawl4ai.content_filter_strategy import PruningContentFilter
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator

# PDF files - specialized extraction
pdf_config = CrawlerRunConfig(
    url_matcher="*.pdf",
    scraping_strategy=PDFContentScrapingStrategy()
)

# Blog/article pages - content filtering
blog_config = CrawlerRunConfig(
    url_matcher=["*/blog/*", "*/article/*", "*python.org*"],
    markdown_generator=DefaultMarkdownGenerator(
        content_filter=PruningContentFilter(threshold=0.48)
    )
)

# Dynamic pages - JavaScript execution
github_config = CrawlerRunConfig(
    url_matcher=lambda url: 'github.com' in url,
    js_code="window.scrollTo(0, 500);"
)

# API endpoints - JSON extraction
api_config = CrawlerRunConfig(
    url_matcher=lambda url: 'api' in url or url.endswith('.json'),
    # Custom settings for JSON extraction
)

# Default fallback config
default_config = CrawlerRunConfig()  # No url_matcher means it never matches except as fallback
```

### Memory Monitoring and Dispatch Results

```python
async def memory_adaptive_crawl():
    dispatcher = MemoryAdaptiveDispatcher(
        memory_threshold_percent=80.0,  # Pause if memory exceeds 80%
        check_interval=1.0,             # Check memory every second
        max_session_permit=15,          # Max concurrent tasks
        memory_wait_timeout=300.0       # Wait up to 5 minutes for memory
    )
    
    config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        word_count_threshold=50
    )
    
    async with AsyncWebCrawler() as crawler:
        results = await crawler.arun_many(
            urls=large_url_list,
            config=config,
            dispatcher=dispatcher
        )
        
        # Each result includes dispatch information
        for result in results:
            if result.dispatch_result:
                dr = result.dispatch_result
                print(f"Memory used: {dr.memory_usage:.1f}MB")
                print(f"Duration: {dr.end_time - dr.start_time}")
```

## Migration from Earlier Versions

### Key Changes from v0.6.x and earlier:

1. **Deprecated Parameters**: Many constructor parameters are now configured via `CrawlerRunConfig`
2. **Enhanced arun_many()**: Now supports dispatchers and streaming
3. **Memory Management**: Built-in memory-adaptive dispatching
4. **Adaptive Features**: New intelligent crawling capabilities

### Updated Basic Usage Pattern:
```python
# v0.7.x recommended pattern
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode

async def main():
    run_config = CrawlerRunConfig(
        verbose=True,            # Detailed logging
        cache_mode=CacheMode.ENABLED,  # Use normal read/write cache
        check_robots_txt=True,   # Respect robots.txt rules
        # ... other parameters
    )

    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(
            url="https://example.com",
            config=run_config
        )
        
        # Check if blocked by robots.txt
        if not result.success and result.status_code == 403:
            print(f"Error: {result.error_message}")
```

## Performance Characteristics

Based on v0.7.x capabilities:

- **True Concurrency**: Native parallel processing with `arun_many()`
- **Memory Adaptive**: Automatic resource management prevents OOM
- **Rate Limiting**: Built-in respectful crawling with configurable delays
- **Streaming**: Real-time result processing for large datasets
- **Intelligent Batching**: Adaptive strategies for different content types

## Best Practices for v0.7.x

1. **Use MemoryAdaptiveDispatcher** for production workloads
2. **Enable streaming mode** for large URL lists (1000+ URLs)
3. **Configure appropriate memory thresholds** based on system resources
4. **Use AdaptiveCrawler** for intelligent content discovery
5. **Implement URL-specific configurations** for different site types
6. **Monitor dispatch results** for performance optimization

---

**References**:
- Official Crawl4AI Repository: https://github.com/unclecode/crawl4ai
- Documentation retrieved via Context7 on September 11, 2025  
- Version: v0.7.4 with adaptive crawling features
- Trust Score: 9.9/10 with 1335+ code snippets