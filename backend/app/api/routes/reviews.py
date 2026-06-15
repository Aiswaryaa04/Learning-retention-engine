from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.review_card import ReviewCard
from app.models.review_log import ReviewLog
from app.models.concept import Concept
from app.schemas.review import ReviewSubmit, ReviewCardResponse, ConceptWithCard
from app.services.sm2_service import calculate_next_review
from datetime import datetime, timezone
import uuid
from app.services.question_service import generate_question
from app.services.rag_service import get_related_context
import asyncio

router = APIRouter()

@router.get("/reviews/due", response_model=list[ConceptWithCard])
async def get_due_reviews(db: AsyncSession = Depends(get_db)):
    """Get all concepts due for review today."""
    
    now = datetime.now(timezone.utc)
    
    result = await db.execute(
        select(ReviewCard, Concept)
        .join(Concept, ReviewCard.concept_id == Concept.id)
        .where(ReviewCard.due_date <= now)
        .order_by(ReviewCard.due_date)
    )
    
    rows = result.all()
    
    due_cards = []
    for card, concept in rows:
        due_cards.append(ConceptWithCard(
            concept_id=concept.id,
            card_id=card.id,
            title=concept.title,
            explanation=concept.explanation,
            due_date=card.due_date,
            interval=card.interval,
            repetitions=card.repetitions
        ))
    
    return due_cards


@router.post("/reviews/{card_id}/submit", response_model=ReviewCardResponse)
async def submit_review(card_id: uuid.UUID, review: ReviewSubmit, db: AsyncSession = Depends(get_db)):
    """Submit a review result and update the SM-2 schedule."""
    
    if review.quality < 0 or review.quality > 5:
        raise HTTPException(status_code=400, detail="Quality must be between 0 and 5")
    
    # Get the card
    result = await db.execute(select(ReviewCard).where(ReviewCard.id == card_id))
    card = result.scalar_one_or_none()
    
    if not card:
        raise HTTPException(status_code=404, detail="Review card not found")
    
    # Calculate next review using SM-2
    new_interval, new_repetitions, new_easiness_factor, due_date = calculate_next_review(
        quality=review.quality,
        repetitions=card.repetitions,
        interval=card.interval,
        easiness_factor=card.easiness_factor
    )
    
    # Update the card
    card.interval = new_interval
    card.repetitions = new_repetitions
    card.easiness_factor = new_easiness_factor
    card.due_date = due_date
    
    # Log this review
    log = ReviewLog(
        id=uuid.uuid4(),
        review_card_id=card.id,
        quality=review.quality
    )
    db.add(log)
    
    await db.commit()
    await db.refresh(card)
    return card

@router.get("/reviews/{card_id}/question")
async def get_question(card_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Generate an AI question for a review card using RAG."""
    
    # Get the card and its concept
    result = await db.execute(
        select(ReviewCard, Concept)
        .join(Concept, ReviewCard.concept_id == Concept.id)
        .where(ReviewCard.id == card_id)
    )
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Card not found")
    
    card, concept = row

    # RAG — find related context
    related_context = await get_related_context(concept.id, db)
    
    # Generate question with Claude (run sync in thread)
    loop = asyncio.get_event_loop()
    question_data = await loop.run_in_executor(
        None,
        generate_question,
        concept.title,
        concept.explanation,
        related_context
    )
    
    return {
        "card_id": card_id,
        "concept_title": concept.title,
        "question": question_data["question"],
        "hint": question_data["hint"],
        "answer": question_data["answer"]
    }

@router.get("/reviews/due/{document_id}", response_model=list[ConceptWithCard])
async def get_due_reviews_by_document(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get due reviews for a specific document."""
    
    now = datetime.now(timezone.utc)
    
    result = await db.execute(
        select(ReviewCard, Concept)
        .join(Concept, ReviewCard.concept_id == Concept.id)
        .where(ReviewCard.due_date <= now)
        .where(Concept.document_id == document_id)
        .order_by(ReviewCard.due_date)
    )
    
    rows = result.all()
    
    due_cards = []
    for card, concept in rows:
        due_cards.append(ConceptWithCard(
            concept_id=concept.id,
            card_id=card.id,
            title=concept.title,
            explanation=concept.explanation,
            due_date=card.due_date,
            interval=card.interval,
            repetitions=card.repetitions
        ))
    
    return due_cards

from app.services.question_service import generate_question, evaluate_answer, get_concept_brushup

@router.post("/reviews/{card_id}/evaluate")
async def evaluate_user_answer(card_id: uuid.UUID, data: dict, db: AsyncSession = Depends(get_db)):
    """Evaluate user's answer using Claude."""
    
    result = await db.execute(
        select(ReviewCard, Concept)
        .join(Concept, ReviewCard.concept_id == Concept.id)
        .where(ReviewCard.id == card_id)
    )
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Card not found")
    
    card, concept = row
    
    loop = asyncio.get_event_loop()
    feedback = await loop.run_in_executor(
        None,
        evaluate_answer,
        data.get("question", ""),
        data.get("correct_answer", ""),
        data.get("user_answer", ""),
        concept.title
    )
    
    return feedback


@router.get("/reviews/{card_id}/brushup")
async def get_brushup(card_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get a deeper explanation of the concept."""
    
    result = await db.execute(
        select(ReviewCard, Concept)
        .join(Concept, ReviewCard.concept_id == Concept.id)
        .where(ReviewCard.id == card_id)
    )
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Card not found")
    
    card, concept = row
    
    related_context = await get_related_context(concept.id, db)
    
    loop = asyncio.get_event_loop()
    explanation = await loop.run_in_executor(
        None,
        get_concept_brushup,
        concept.title,
        concept.explanation,
        related_context
    )
    
    return {"brushup": explanation}

from app.services.sm2_service import calculate_next_review, calculate_forgetting_risk

@router.get("/reviews/stats")
async def get_review_stats(db: AsyncSession = Depends(get_db)):
    """Get overview stats including at-risk concepts."""
    
    now = datetime.now(timezone.utc)
    
    # Get all cards with their concepts
    result = await db.execute(
        select(ReviewCard, Concept)
        .join(Concept, ReviewCard.concept_id == Concept.id)
        .order_by(ReviewCard.due_date)
    )
    rows = result.all()
    
    due_today = []
    at_risk = []
    overdue = []
    safe = []
    
    for card, concept in rows:
        risk_data = calculate_forgetting_risk(card.due_date, card.interval)
        
        item = {
            "card_id": str(card.id),
            "concept_title": concept.title,
            "due_date": card.due_date.isoformat(),
            "interval": card.interval,
            "repetitions": card.repetitions,
            **risk_data
        }
        
        if risk_data["risk"] == "at_risk":
            at_risk.append(item)
        elif risk_data["risk"] == "overdue":
            overdue.append(item)
        elif risk_data["risk"] == "due_today":
            due_today.append(item)
        else:
            safe.append(item)
    
    return {
        "due_today": due_today,
        "overdue": overdue,
        "at_risk": at_risk,
        "safe": safe,
        "total_concepts": len(rows),
        "needs_attention": len(due_today) + len(overdue) + len(at_risk)
    }