from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

from app.models.document import Document
from app.models.concept import Concept
from app.models.review_card import ReviewCard
from app.models.review_log import ReviewLog