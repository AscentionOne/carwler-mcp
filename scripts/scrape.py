#!/usr/bin/env python3.11
"""
Simple Crawl4AI wrapper script for Node.js integration
Usage: python3.11 scrape.py <url> [config_json]
"""

import asyncio
import sys
import json
import os
import logging
from pathlib import Path

# Redirect Crawl4AI logging to stderr to keep stdout clean for JSON
logging.basicConfig(
    level=logging.WARNING,  # Only show warnings and errors
    format='%(message)s',
    stream=sys.stderr
)

try:
    from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
    from crawl4ai import MemoryAdaptiveDispatcher, CrawlerMonitor, DisplayMode
    from crawl4ai import RateLimiter
    from crawl4ai.async_crawler_strategy import AsyncHTTPCrawlerStrategy
    import asyncio
except ImportError as e:
    print(json.dumps({
        "success": False,
        "error": f"Crawl4AI not installed: {e}. Run: pip install crawl4ai && crawl4ai-setup",
        "url": sys.argv[1] if len(sys.argv) > 1 else "",
        "status_code": 0,
        "markdown": ""
    }))
    sys.exit(1)

async def batch_crawl_native(urls: list, config_options: dict):
    """
    Native Crawl4AI batch processing using arun_many() and all native features
    Implements the standards-compliant approach from our implementation plan
    """
    try:
        # Native configuration with all built-in options
        crawl_config = CrawlerRunConfig(
            cache_mode=getattr(CacheMode, config_options.get('cache_mode', 'ENABLED'))
        )
        
        # Add session_id if provided
        if config_options.get('session_id'):
            crawl_config.session_id = config_options.get('session_id')
        
        # COMPLETE native memory management (v0.7.x compliant)
        dispatcher = MemoryAdaptiveDispatcher(
            memory_threshold_percent=config_options.get('memory_threshold', 70.0),
            check_interval=config_options.get('check_interval', 1.0),  # Native monitoring interval
            max_session_permit=config_options.get('max_sessions', 10),
            memory_wait_timeout=config_options.get('memory_wait_timeout', 300.0),  # v0.7.x parameter
            rate_limiter=RateLimiter(
                base_delay=tuple(config_options.get('base_delay', [0.5, 1.5])),
                max_delay=config_options.get('max_delay', 30.0),
                max_retries=config_options.get('max_retries', 5)
            ) if config_options.get('enable_rate_limiting', True) else None,
            monitor=None  # Disable monitor UI for subprocess to keep stdout clean
        )
        
        # Native browser configuration with optional persistence
        browser_config = BrowserConfig(
            headless=config_options.get('headless', True),
            viewport_width=1280,
            viewport_height=720,
            verbose=False,
            extra_args=[
                "--no-sandbox",
                "--disable-dev-shm-usage", 
                "--disable-gpu"
            ]
        )
        
        # Add persistent browser options if specified
        if config_options.get('persistent_browser'):
            browser_config.use_managed_browser = True
        if config_options.get('user_data_dir'):
            browser_config.user_data_dir = config_options.get('user_data_dir')
        
        # Choose crawler strategy: browser vs HTTP-only
        strategy = config_options.get('strategy', 'browser')
        
        if strategy == 'http':
            # OPTION 1: Native AsyncHTTPCrawlerStrategy for high-performance HTTP-only crawling
            max_connections = config_options.get('max_connections', 20)
            async with AsyncHTTPCrawlerStrategy(max_connections=max_connections) as http_strategy:
                if config_options.get('stream_mode'):
                    # HTTP strategy with streaming simulation
                    results = []
                    tasks = [http_strategy.crawl(url) for url in urls]
                    for i, task in enumerate(asyncio.as_completed(tasks)):
                        try:
                            result = await task
                            formatted_result = {
                                "success": result.success if hasattr(result, 'success') else True,
                                "markdown": result.html if hasattr(result, 'html') else getattr(result, 'markdown', ''),
                                "url": urls[tasks.index(task)] if hasattr(tasks, 'index') else urls[i] if i < len(urls) else '',
                                "status_code": getattr(result, 'status_code', 200),
                                "title": getattr(result, 'title', ''),
                                "content_length": len(result.html) if hasattr(result, 'html') else 0,
                                "error": getattr(result, 'error_message', None)
                            }
                            results.append(formatted_result)
                        except Exception as e:
                            results.append({
                                "success": False,
                                "markdown": "",
                                "url": urls[i] if i < len(urls) else '',
                                "status_code": 0,
                                "title": "",
                                "content_length": 0,
                                "error": f"HTTP strategy error: {str(e)}"
                            })
                    return results
                else:
                    # HTTP strategy batch mode
                    tasks = [http_strategy.crawl(url) for url in urls]
                    http_results = await asyncio.gather(*tasks, return_exceptions=True)
                    return [
                        {
                            "success": not isinstance(result, Exception) and getattr(result, 'success', True),
                            "markdown": result.html if hasattr(result, 'html') and not isinstance(result, Exception) else "",
                            "url": url,
                            "status_code": getattr(result, 'status_code', 200) if not isinstance(result, Exception) else 0,
                            "title": getattr(result, 'title', '') if not isinstance(result, Exception) else '',
                            "content_length": len(result.html) if hasattr(result, 'html') and not isinstance(result, Exception) else 0,
                            "error": str(result) if isinstance(result, Exception) else getattr(result, 'error_message', None)
                        }
                        for result, url in zip(http_results, urls)
                    ]
        else:
            # OPTION 2: Native AsyncWebCrawler (browser strategy) - default
            async with AsyncWebCrawler(config=browser_config) as crawler:
                if config_options.get('stream_mode'):
                    # Native streaming mode - process results as they complete
                    results = []
                    async for result in await crawler.arun_many(urls, config=crawl_config, dispatcher=dispatcher):
                        formatted_result = {
                            "success": result.success,
                            "markdown": result.markdown.raw_markdown if result.success else "",
                            "url": result.url,
                            "status_code": getattr(result, 'status_code', 200),
                            "title": getattr(result, 'title', ''),
                            "content_length": len(result.markdown.raw_markdown) if result.success else 0,
                            "error": result.error_message if not result.success else None
                        }
                        results.append(formatted_result)
                    return results
                else:
                    # Native batch mode - get all results at once
                    crawl_results = await crawler.arun_many(urls, config=crawl_config, dispatcher=dispatcher)
                    return [
                        {
                            "success": result.success,
                            "markdown": result.markdown.raw_markdown if result.success else "",
                            "url": result.url,
                            "status_code": getattr(result, 'status_code', 200),
                            "title": getattr(result, 'title', ''),
                            "content_length": len(result.markdown.raw_markdown) if result.success else 0,
                            "error": result.error_message if not result.success else None
                        }
                        for result in crawl_results
                    ]
            
    except Exception as e:
        # Return error for all URLs if batch processing fails
        return [
            {
                "success": False,
                "markdown": "",
                "url": url,
                "status_code": 0,
                "title": "",
                "content_length": 0,
                "error": f"Batch crawler exception: {str(e)}"
            }
            for url in urls
        ]

async def scrape_url(url, config=None):
    """Scrape a URL and return clean markdown"""
    try:
        # Default browser configuration for clean scraping
        browser_config = BrowserConfig(
            headless=True,
            viewport_width=1280,
            viewport_height=720,
            verbose=False,  # Disable verbose logging for clean JSON output
            # Optimize for speed and content quality
            extra_args=[
                "--no-sandbox",
                "--disable-dev-shm-usage", 
                "--disable-gpu"
            ]
        )
        
        # Default crawler configuration optimized for documentation
        run_config = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,  # Always fresh content for now
            # Target main content areas (try broader selectors first)
            css_selector="body",  # Start with body, let Crawl4AI do smart extraction
            # Remove navigation and clutter  
            excluded_tags=["nav", "footer", "aside", "header", "script", "style", "noscript", "iframe"],
            # Quality filters
            word_count_threshold=10,  # Lower threshold to get more content
            exclude_external_links=True,
            exclude_social_media_links=True,
            exclude_external_images=True,
            # Reasonable timeout
            page_timeout=30000,  # 30 seconds
            verbose=False  # Disable verbose logging
        )
        
        # Apply custom config if provided
        if config:
            if 'css_selector' in config:
                run_config.css_selector = config['css_selector']
            if 'excluded_tags' in config:
                run_config.excluded_tags = config['excluded_tags']
            if 'word_count_threshold' in config:
                run_config.word_count_threshold = config['word_count_threshold']
            if 'page_timeout' in config:
                run_config.page_timeout = config['page_timeout']
        
        # Perform the crawl
        async with AsyncWebCrawler(config=browser_config) as crawler:
            result = await crawler.arun(url=url, config=run_config)
            
            # Extract title from result if available
            title = ""
            if hasattr(result, 'title') and result.title:
                title = result.title
            elif hasattr(result, 'metadata') and result.metadata and 'title' in result.metadata:
                title = result.metadata['title']
            
            return {
                "success": result.success,
                "markdown": result.markdown if result.success else "",
                "url": result.url,
                "status_code": getattr(result, 'status_code', 200),
                "title": title,
                "content_length": len(result.markdown) if result.success else 0,
                "error": result.error_message if not result.success else None
            }
            
    except Exception as e:
        return {
            "success": False,
            "markdown": "",
            "url": url,
            "status_code": 0,
            "title": "",
            "content_length": 0,
            "error": f"Crawler exception: {str(e)}"
        }

def validate_url(url):
    """Basic URL validation"""
    if not url:
        return False, "URL cannot be empty"
    
    if not url.startswith(('http://', 'https://')):
        return False, "URL must start with http:// or https://"
    
    # Basic format check
    if not ('.' in url and len(url) > 10):
        return False, "URL appears to be malformed"
    
    return True, ""

def main():
    """Main entry point - supports both single URL and native batch processing"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python3 scrape.py <url> [config_json] OR python3 scrape.py --native-batch-crawl --urls <urls_json> --config <config_json>",
            "help": "Single URL: python3.11 scrape.py https://example.com\nBatch: python3 scrape.py --native-batch-crawl --urls '[\"url1\", \"url2\"]' --config '{\"strategy\": \"browser\"}'"
        }))
        sys.exit(1)
    
    # Check for native batch crawling mode
    if sys.argv[1] == '--native-batch-crawl':
        # Native batch processing mode
        if len(sys.argv) < 6 or '--urls' not in sys.argv or '--config' not in sys.argv:
            print(json.dumps({
                "success": False,
                "error": "Native batch mode requires: --native-batch-crawl --urls <urls_json> --config <config_json>",
                "help": "Example: python3 scrape.py --native-batch-crawl --urls '[\"https://example.com\", \"https://google.com\"]' --config '{\"strategy\": \"browser\", \"stream_mode\": false}'"
            }))
            sys.exit(1)
        
        try:
            # Parse URLs and config from command line arguments
            urls_idx = sys.argv.index('--urls') + 1
            config_idx = sys.argv.index('--config') + 1
            
            urls = json.loads(sys.argv[urls_idx])
            config_options = json.loads(sys.argv[config_idx])
            
            # Validate URLs
            if not isinstance(urls, list) or len(urls) == 0:
                print(json.dumps({
                    "success": False,
                    "error": "URLs must be a non-empty list",
                    "help": "Example: '[\"https://example.com\", \"https://google.com\"]'"
                }))
                sys.exit(1)
            
            # Validate each URL
            for url in urls:
                is_valid, error_msg = validate_url(url)
                if not is_valid:
                    print(json.dumps({
                        "success": False,
                        "error": f"Invalid URL '{url}': {error_msg}",
                        "urls": urls
                    }))
                    sys.exit(1)
            
            # Run native batch crawler
            results = asyncio.run(batch_crawl_native(urls, config_options))
            print(json.dumps(results, indent=2, ensure_ascii=False))
            
        except ValueError as e:
            print(json.dumps({
                "success": False,
                "error": f"Invalid arguments: {str(e)}",
                "help": "Check --urls and --config JSON format"
            }))
            sys.exit(1)
        except json.JSONDecodeError as e:
            print(json.dumps({
                "success": False,
                "error": f"Invalid JSON: {e}",
                "help": "Ensure URLs and config are valid JSON"
            }))
            sys.exit(1)
        except Exception as e:
            print(json.dumps({
                "success": False,
                "error": f"Batch crawling error: {str(e)}",
                "urls": urls if 'urls' in locals() else []
            }))
            sys.exit(1)
    
    else:
        # Original single URL mode (backward compatibility)
        url = sys.argv[1].strip()
        config = None
        
        # Validate URL
        is_valid, error_msg = validate_url(url)
        if not is_valid:
            print(json.dumps({
                "success": False,
                "error": f"Invalid URL: {error_msg}",
                "url": url
            }))
            sys.exit(1)
        
        # Parse config if provided
        if len(sys.argv) > 2:
            try:
                config = json.loads(sys.argv[2])
            except json.JSONDecodeError as e:
                print(json.dumps({
                    "success": False,
                    "error": f"Invalid JSON config: {e}",
                    "url": url
                }))
                sys.exit(1)
        
        # Run the single URL scraper
        try:
            result = asyncio.run(scrape_url(url, config))
            print(json.dumps(result, indent=2, ensure_ascii=False))
        except KeyboardInterrupt:
            print(json.dumps({
                "success": False,
                "error": "Scraping interrupted by user",
                "url": url
            }))
            sys.exit(1)
        except Exception as e:
            print(json.dumps({
                "success": False,
                "error": f"Unexpected error: {str(e)}",
                "url": url
            }))
            sys.exit(1)

if __name__ == "__main__":
    main()