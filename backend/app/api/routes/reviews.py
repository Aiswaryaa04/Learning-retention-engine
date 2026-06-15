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