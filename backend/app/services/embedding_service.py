import hashlib
import math

def get_embedding(text: str) -> list[float]:
    """
    Lightweight deterministic embedding for deployment.
    Uses character-level hashing to produce a 384-dim vector.
    """
    vector = [0.0] * 384
    
    words = text.lower().split()
    for i, word in enumerate(words):
        hash_val = int(hashlib.md5(word.encode()).hexdigest(), 16)
        for j in range(8):
            idx = (hash_val + i * 8 + j) % 384
            vector[idx] += 1.0 / (i + 1)
    
    magnitude = math.sqrt(sum(x * x for x in vector)) or 1.0
    vector = [x / magnitude for x in vector]
    
    return vector