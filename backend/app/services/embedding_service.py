from google import genai
from google.genai import types
from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

def get_embedding(text: str) -> list[float]:
    """Get real semantic embedding using Gemini."""
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
    )
    return result.embeddings[0].values