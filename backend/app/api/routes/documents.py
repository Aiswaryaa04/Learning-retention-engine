from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.document import Document
from app.models.concept import Concept
from app.models.review_card import ReviewCard
from app.schemas.document import DocumentCreate, DocumentResponse
from app.schemas.concept import ConceptResponse
from app.services.claude_service import extract_concepts
from app.services.embedding_service import get_embedding
import uuid
import asyncio

router = APIRouter()

@router.post("/documents", response_model=DocumentResponse)
async def create_document(doc: DocumentCreate, db: AsyncSession = Depends(get_db)):
    
    # 1. Save the document
    document = Document(
        id=uuid.uuid4(),
        title=doc.title,
        content=doc.content,
        source_type=doc.source_type,
        source_url=doc.source_url
    )
    db.add(document)
    await db.flush()

    # 2. Ask Claude to extract concepts (run sync function in thread)
    try:
        loop = asyncio.get_event_loop()
        concepts_data = await loop.run_in_executor(None, extract_concepts, doc.content)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Claude extraction failed: {str(e)}")

    # 3. Save each concept + embedding + review card
    for concept_data in concepts_data:
        embedding = get_embedding(concept_data["title"] + " " + concept_data["explanation"])
        
        concept = Concept(
            id=uuid.uuid4(),
            document_id=document.id,
            title=concept_data["title"],
            explanation=concept_data["explanation"],
            embedding=embedding
        )
        db.add(concept)
        await db.flush()

        card = ReviewCard(
            id=uuid.uuid4(),
            concept_id=concept.id
        )
        db.add(card)

    await db.commit()
    await db.refresh(document)
    return document


@router.get("/documents/{document_id}/concepts", response_model=list[ConceptResponse])
async def get_concepts(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    result = await db.execute(
        select(Concept).where(Concept.document_id == document_id)
    )
    concepts = result.scalars().all()
    return concepts