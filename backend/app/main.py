from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.db.base import Base
from app.db.session import engine
from app.api.routes.documents import router as documents_router
from app.api.routes.reviews import router as reviews_router

app = FastAPI(title="Learning Retention Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://learning-retention-engine.vercel.app"
        "https://learning-retention-engine-2lw7t7omh-aiswaryaa04s-projects.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)

app.include_router(documents_router, prefix="/api/v1", tags=["documents"])
app.include_router(reviews_router, prefix="/api/v1", tags=["reviews"])

@app.get("/health")
async def health():
    return {"status": "ok"}