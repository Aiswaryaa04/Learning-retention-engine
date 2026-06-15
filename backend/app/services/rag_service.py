from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.models.concept import Concept

async def get_related_context(concept_id: str, db: AsyncSession, limit: int = 3) -> str:
    """Find related concepts using vector similarity search."""
    
    result = await db.execute(
        select(Concept).where(Concept.id == concept_id)
    )
    concept = result.scalar_one_or_none()
    
    if not concept or concept.embedding is None:
        return ""
    
    # Convert embedding to proper pgvector format [0.1,0.2,...]
    embedding_list = concept.embedding.tolist() if hasattr(concept.embedding, 'tolist') else list(concept.embedding)
    embedding_str = "[" + ",".join(str(x) for x in embedding_list) + "]"
    
    similar = await db.execute(
        text("""
            SELECT title, explanation 
            FROM concepts 
            WHERE id != :concept_id 
            AND embedding IS NOT NULL
            ORDER BY embedding <=> CAST(:embedding AS vector)
            LIMIT :limit
        """),
        {
            "concept_id": str(concept_id),
            "embedding": embedding_str,
            "limit": limit
        }
    )
    
    rows = similar.fetchall()
    
    if not rows:
        return ""
    
    context = "\n".join([f"- {row.title}: {row.explanation}" for row in rows])
    return context