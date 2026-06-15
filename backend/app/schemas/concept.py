from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class ConceptResponse(BaseModel):
    id: UUID
    document_id: UUID
    title: str
    explanation: str
    created_at: datetime

    model_config = {"from_attributes": True}