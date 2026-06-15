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
from app.models.review_log import ReviewLog
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

from sqlalchemy import func
from app.models.review_card import ReviewCard

@router.get("/documents", response_model=list[dict])
async def get_documents(db: AsyncSession = Depends(get_db)):
    """Get all documents with concept counts."""
    from sqlalchemy import select, func
    
    result = await db.execute(
        select(
            Document.id,
            Document.title,
            Document.source_type,
            Document.created_at,
            func.count(Concept.id).label("concept_count")
        )
        .outerjoin(Concept, Concept.document_id == Document.id)
        .group_by(Document.id)
        .order_by(Document.created_at.desc())
    )
    
    rows = result.all()
    return [
        {
            "id": str(row.id),
            "title": row.title,
            "source_type": row.source_type,
            "created_at": row.created_at.isoformat(),
            "concept_count": row.concept_count
        }
        for row in rows
    ]

@router.delete("/documents/{document_id}")
async def delete_document(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Delete a document and all its concepts and review cards."""
    from sqlalchemy import delete

    # Delete review logs first
    concepts_result = await db.execute(
        select(Concept).where(Concept.document_id == document_id)
    )
    concepts = concepts_result.scalars().all()

    for concept in concepts:
        cards_result = await db.execute(
            select(ReviewCard).where(ReviewCard.concept_id == concept.id)
        )
        cards = cards_result.scalars().all()
        for card in cards:
            await db.execute(
                delete(ReviewLog).where(ReviewLog.review_card_id == card.id)
            )
        await db.execute(
            delete(ReviewCard).where(ReviewCard.concept_id == concept.id)
        )

    await db.execute(
        delete(Concept).where(Concept.document_id == document_id)
    )
    await db.execute(
        delete(Document).where(Document.id == document_id)
    )

    await db.commit()
    return {"message": "Document deleted successfully"}


@router.patch("/documents/{document_id}")
async def update_document(document_id: uuid.UUID, data: dict, db: AsyncSession = Depends(get_db)):
    """Update a document title."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if "title" in data:
        document.title = data["title"]

    await db.commit()
    await db.refresh(document)
    return {"message": "Document updated successfully"}