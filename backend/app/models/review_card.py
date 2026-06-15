from sqlalchemy import Column, Float, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.db.base import Base

class ReviewCard(Base):
    __tablename__ = "review_cards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    concept_id = Column(UUID(as_uuid=True), ForeignKey("concepts.id"), nullable=False)

    # SM-2 algorithm fields
    easiness_factor = Column(Float, default=2.5)  # how easy this card is (2.5 = average)
    interval = Column(Integer, default=1)          # days until next review
    repetitions = Column(Integer, default=0)       # how many times reviewed
    due_date = Column(DateTime(timezone=True), server_default=func.now())

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())