from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.db.base import Base

class ReviewLog(Base):
    __tablename__ = "review_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_card_id = Column(UUID(as_uuid=True), ForeignKey("review_cards.id"), nullable=False)
    quality = Column(Integer, nullable=False)
    question = Column(Text)
    user_answer = Column(Text)
    reviewed_at = Column(DateTime(timezone=True), server_default=func.now())