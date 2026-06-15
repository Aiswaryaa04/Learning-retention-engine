from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class ReviewSubmit(BaseModel):
    quality: int  # 0-5

class ReviewCardResponse(BaseModel):
    id: UUID
    concept_id: UUID
    easiness_factor: float
    interval: int
    repetitions: int
    due_date: datetime

    model_config = {"from_attributes": True}

class ConceptWithCard(BaseModel):
    concept_id: UUID
    card_id: UUID
    title: str
    explanation: str
    due_date: datetime
    interval: int
    repetitions: int

    model_config = {"from_attributes": True}