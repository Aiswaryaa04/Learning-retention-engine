from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.document import Document
from app.models.concept import Concept
from app.models.review_card import ReviewCard
from app.models.review_log import ReviewLog
from app.schemas.document import DocumentCreate, DocumentResponse
from app.schemas.concept import ConceptResponse
from app.services.claude_service import extract_concepts
from app.services.embedding_service import get_embedding
from app.services.pdf_service import extract_text_from_pdf
import uuid
import asyncio

router = APIRouter()


@router.post("/documents", response_model=DocumentResponse)
async def create_document(doc: DocumentCreate, db: AsyncSession = Depends(get_db)):
    """Upload content and extract concepts using Claude."""

    document = Document(
        id=uuid.uuid4(),
        title=doc.title,
        content=doc.content,
        source_type=doc.source_type,
        source_url=doc.source_url
    )
    db.add(document)
    await db.flush()

    try:
        loop = asyncio.get_event_loop()
        concepts_data = await loop.run_in_executor(None, extract_concepts, doc.content)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Claude extraction failed: {str(e)}")

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


@router.post("/documents/upload-pdf", response_model=DocumentResponse)
async def upload_pdf(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Upload a PDF and extract concepts using Claude."""

    file_bytes = await file.read()
    try:
        content = extract_text_from_pdf(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF extraction failed: {str(e)}")

    if not content:
        raise HTTPException(status_code=400, detail="No text found in PDF")

    document = Document(
        id=uuid.uuid4(),
        title=title,
        content=content,
        source_type="pdf"
    )
    db.add(document)
    await db.flush()

    try:
        loop = asyncio.get_event_loop()
        concepts_data = await loop.run_in_executor(None, extract_concepts, content[:3000])
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Claude extraction failed: {str(e)}")

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


@router.get("/documents", response_model=list[dict])
async def get_documents(db: AsyncSession = Depends(get_db)):
    """Get all documents with concept counts."""

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


@router.get("/documents/{document_id}/concepts", response_model=list[ConceptResponse])
async def get_concepts(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get all concepts extracted from a document."""

    result = await db.execute(
        select(Concept).where(Concept.document_id == document_id)
    )
    concepts = result.scalars().all()
    return concepts


@router.delete("/documents/{document_id}")
async def delete_document(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Delete a document and all its concepts and review cards."""
    from sqlalchemy import delete as sql_delete

    concepts_result = await db.execute(
        select(Concept).where(Concept.document_id == document_id)
    )
    concepts = concepts_result.scalars().all()
    concept_ids = [c.id for c in concepts]

    if concept_ids:
        cards_result = await db.execute(
            select(ReviewCard).where(ReviewCard.concept_id.in_(concept_ids))
        )
        cards = cards_result.scalars().all()
        card_ids = [c.id for c in cards]

        if card_ids:
            await db.execute(
                sql_delete(ReviewLog).where(ReviewLog.review_card_id.in_(card_ids))
            )
        await db.execute(
            sql_delete(ReviewCard).where(ReviewCard.concept_id.in_(concept_ids))
        )
        await db.execute(
            sql_delete(Concept).where(Concept.document_id == document_id)
        )

    await db.execute(
        sql_delete(Document).where(Document.id == document_id)
    )
    await db.commit()
    return {"message": "Deleted successfully"}


@router.patch("/documents/{document_id}")
async def update_document(document_id: uuid.UUID, data: dict, db: AsyncSession = Depends(get_db)):
    """Update a document title."""
    from sqlalchemy import update as sql_update

    if "title" in data:
        await db.execute(
            sql_update(Document)
            .where(Document.id == document_id)
            .values(title=data["title"])
        )
        await db.commit()

    return {"message": "Updated successfully"}