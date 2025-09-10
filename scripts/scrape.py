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
except ImportError as e:
    print(json.dumps({
        "success": False,
        "error": f"Crawl4AI not installed: {e}. Run: pip install crawl4ai && crawl4ai-setup",
        "url": sys.argv[1] if len(sys.argv) > 1 else "",
        "status_code": 0,
        "markdown": ""
    }))
    sys.exit(1)

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
    """Main entry point"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python3 scrape.py <url> [config_json]",
            "help": "Example: python3.11 scrape.py https://example.com"
        }))
        sys.exit(1)
    
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
    
    # Run the scraper
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