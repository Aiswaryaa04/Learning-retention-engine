import httpx
from bs4 import BeautifulSoup

def scrape_url(url: str) -> str:
    """Fetch and extract text content from any URL."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = httpx.get(url, timeout=15, headers=headers, follow_redirects=True)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove noise
        for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 'advertisement']):
            tag.decompose()
        
        # Get main content
        main = soup.find('main') or soup.find('article') or soup.find('body')
        text = main.get_text(separator=' ', strip=True) if main else soup.get_text(separator=' ', strip=True)
        
        # Clean up whitespace
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        clean_text = ' '.join(lines)
        
        return clean_text[:5000]
    except Exception as e:
        raise ValueError(f"Could not fetch content from URL: {str(e)}")