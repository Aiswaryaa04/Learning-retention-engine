import anthropic
import json
import re
from app.core.config import settings

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

def extract_concepts(content: str) -> list[dict]:
    
    prompt = f"""You are an expert at extracting key concepts from educational content.

Analyze the following text and extract the most important concepts a student should learn and remember.

For each concept provide:
1. A short title (max 5 words)
2. A clear explanation (2-3 sentences)

Return ONLY a JSON array with this exact format, no other text, no markdown, no code blocks:
[
  {{
    "title": "concept title here",
    "explanation": "clear explanation here"
  }}
]

Extract between 3 and 8 concepts depending on the content length.

Content to analyze:
{content}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    response_text = message.content[0].text
    
    # Strip markdown code blocks if Claude adds them
    response_text = re.sub(r'```json\s*', '', response_text)
    response_text = re.sub(r'```\s*', '', response_text)
    response_text = response_text.strip()
    
    concepts = json.loads(response_text)
    return concepts