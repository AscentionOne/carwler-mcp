# Crawl4AI Advanced Configuration & Features

## Browser Configuration (BrowserConfig)

### Basic Setup
```python
from crawl4ai import BrowserConfig, AsyncWebCrawler

browser_config = BrowserConfig(
    browser_type="chromium",  # "chromium", "firefox", "webkit"
    headless=True,           # False for visible browser (debugging)
    viewport_width=1280,
    viewport_height=720,
    verbose=True
)
```

### Advanced Browser Configuration
```python
browser_config = BrowserConfig(
    headless=False,
    proxy="http://user:pass@proxy:8080",
    use_persistent_context=True,
    user_data_dir="./browser_data",
    cookies=[
        {"name": "session", "value": "abc123", "domain": "example.com"}
    ],
    headers={"Accept-Language": "en-US,en;q=0.9"},
    user_agent="Mozilla/5.0 (X11; Linux x86_64) Chrome/116.0.0.0 Safari/537.36",
    text_mode=True,  # Disable images for faster crawling
    extra_args=["--disable-extensions", "--no-sandbox"]
)
```

## Crawler Run Configuration (CrawlerRunConfig)

### Content Filtering
```python
from crawl4ai import CrawlerRunConfig, CacheMode

config = CrawlerRunConfig(
    css_selector="main.content", 
    word_count_threshold=10,
    excluded_tags=["nav", "footer", "script", "style"],
    exclude_external_links=True,
    exclude_social_media_links=True,
    exclude_domains=["ads.com", "spammytrackers.net"],
    exclude_external_images=True,
    cache_mode=CacheMode.BYPASS
)
```

### Advanced Configuration
```python
config = CrawlerRunConfig(
    stream=True,
    cache_mode=CacheMode.BYPASS,
    session_id="my_session",
    simulate_user=True,
    wait_for="css:.content-loaded",
    page_timeout=60000,
    delay_before_return_html=2000,
    screenshot=True,
    js_code=["window.scrollTo(0, document.body.scrollHeight);"]
)
```

## Extraction Strategies

### CSS/JSON Extraction
```python
from crawl4ai import JsonCssExtractionStrategy

schema = {
    "name": "Product Listings",
    "baseSelector": "div.product",
    "fields": [
        {"name": "title", "selector": "h2", "type": "text"},
        {"name": "price", "selector": ".price", "type": "text"},
        {"name": "link", "selector": "a", "type": "attribute", "attribute": "href"}
    ]
}

config = CrawlerRunConfig(
    extraction_strategy=JsonCssExtractionStrategy(schema)
)
```

### LLM Extraction
```python
from crawl4ai import LLMExtractionStrategy, LLMConfig
from pydantic import BaseModel, Field

class Product(BaseModel):
    name: str = Field(..., description="Product name")
    price: str = Field(..., description="Product price")
    description: str = Field(..., description="Product description")

llm_strategy = LLMExtractionStrategy(
    llm_config=LLMConfig(provider="openai/gpt-4o", api_token="your-key"),
    schema=Product.model_json_schema(),
    extraction_type="schema",
    instruction="Extract product information from the page"
)

config = CrawlerRunConfig(extraction_strategy=llm_strategy)
```

## Markdown Generation

### Custom Markdown Options
```python
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator
from crawl4ai.content_filter_strategy import PruningContentFilter

md_generator = DefaultMarkdownGenerator(
    options={
        "ignore_links": False,
        "escape_html": True,
        "body_width": 120
    },
    content_filter=PruningContentFilter(threshold=0.4, threshold_type="fixed")
)

config = CrawlerRunConfig(markdown_generator=md_generator)
```

## Proxy Configuration

### Single Proxy
```python
from crawl4ai import ProxyConfig

proxy_config = ProxyConfig(
    server="http://proxy.example.com:8080",
    username="proxy_user",
    password="proxy_pass"
)

# Or from string format
proxy_config = ProxyConfig.from_string("192.168.1.100:8080:username:password")
```

### Proxy Rotation
```python
from crawl4ai import ProxyRotationStrategy

proxies = [
    ProxyConfig(server="http://proxy1.com:8080", username="user1", password="pass1"),
    ProxyConfig(server="http://proxy2.com:8080", username="user2", password="pass2"),
    ProxyConfig(server="http://proxy3.com:8080", username="user3", password="pass3")
]

rotation_strategy = ProxyRotationStrategy(
    proxies=proxies,
    rotation_method="round_robin"  # or "random", "least_used"
)

config = CrawlerRunConfig(
    proxy_config=proxy_config,
    proxy_rotation_strategy=rotation_strategy
)
```

## Performance & Memory Management

### Memory Monitoring
```python
from crawl4ai.memory_utils import MemoryMonitor

monitor = MemoryMonitor()

async with AsyncWebCrawler() as crawler:
    monitor.start_monitoring()
    
    results = await crawler.arun_many([
        "https://site1.com",
        "https://site2.com"
    ])
    
    memory_report = monitor.get_report()
    print(f"Peak memory usage: {memory_report['peak_mb']:.1f} MB")
```

### Memory Adaptive Dispatcher
```python
from crawl4ai import MemoryAdaptiveDispatcher

dispatcher = MemoryAdaptiveDispatcher(
    memory_threshold_percent=80.0,  # Pause if memory usage exceeds 80%
    check_interval=0.5  # Check memory every 0.5 seconds
)

async with AsyncWebCrawler() as crawler:
    results = await crawler.arun_many(
        urls=["https://docs.crawl4ai.com", "https://github.com/unclecode/crawl4ai"],
        config=CrawlerRunConfig(stream=True),
        dispatcher=dispatcher,
    )
```

## Session Management

### Persistent Sessions
```python
async with AsyncWebCrawler() as crawler:
    # Login or setup session
    result1 = await crawler.arun(
        "https://site.com/login",
        config=CrawlerRunConfig(session_id="user_session")
    )
    
    # Use same session for protected content
    result2 = await crawler.arun(
        "https://site.com/protected-page",
        config=CrawlerRunConfig(session_id="user_session")
    )
```

## Error Handling & Debugging

### Comprehensive Error Handling
```python
async def safe_crawl(url):
    try:
        async with AsyncWebCrawler() as crawler:
            result = await crawler.arun(url)
            
            if result.success:
                return {
                    "success": True,
                    "markdown": result.markdown,
                    "url": result.url,
                    "status_code": result.status_code
                }
            else:
                return {
                    "success": False,
                    "error": result.error_message,
                    "url": url,
                    "status_code": result.status_code
                }
                
    except Exception as e:
        return {
            "success": False,
            "error": f"Crawler exception: {str(e)}",
            "url": url,
            "status_code": 0
        }
```

## CLI Usage

### Basic Commands
```bash
# Basic crawl
crwl https://example.com

# Get markdown output
crwl https://example.com -o markdown

# Use configuration files
crwl https://example.com -B browser.yml -C crawler.yml

# LLM-based extraction
crwl https://example.com -e extract.yml -s schema.json

# Ask questions about content
crwl https://example.com -q "What is the main topic?"
```

### Configuration Files
```yaml
# browser.yml
headless: true
viewport_width: 1280
viewport_height: 720
text_mode: true

# crawler.yml
cache_mode: "BYPASS"
css_selector: "main, article"
excluded_tags: ["nav", "footer", "aside"]
word_count_threshold: 10
```