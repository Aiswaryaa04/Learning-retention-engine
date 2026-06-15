from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
import uuid
from app.db.base import Base

class Concept(Base):
    __tablename__ = "concepts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    title = Column(String(500), nullable=False)   # e.g. "Python Decorators"
    explanation = Column(Text, nullable=False)     # Claude's explanation
    embedding = Column(Vector(384))               # semantic vector
    created_at = Column(DateTime(timezone=True), server_default=func.now())