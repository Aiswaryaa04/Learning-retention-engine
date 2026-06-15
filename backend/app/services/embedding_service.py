from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')

def get_embedding(text: str) -> list[float]:
    """Convert text to a vector embedding."""
    embedding = model.encode(text)
    return embedding.tolist()