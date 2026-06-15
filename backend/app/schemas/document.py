from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class DocumentCreate(BaseModel):
    title: str
    content: str
    source_type: str = "text"
    source_url: Optional[str] = None

class DocumentResponse(BaseModel):
    id: UUID
    title: str
    content: str
    source_type: str
    created_at: datetime

    model_config = {"from_attributes": True}