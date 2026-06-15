# Learning Retention Engine

An AI-powered spaced repetition learning app that extracts key concepts from any study material and quizzes you at the optimal time using the SM-2 algorithm.

## Demo

Upload any text or PDF → AI extracts concepts → Get quizzed at the right time → Never forget what you learned

---

## How It Works

1. **Upload** any text, notes, article, or PDF
2. **Claude AI** extracts the key concepts automatically
3. **Vector embeddings** store concepts for semantic search
4. **SM-2 algorithm** schedules your next review based on performance
5. **RAG pipeline** retrieves related context to generate grounded questions
6. **Active recall** — type your answer, get AI feedback, deep dive into any concept

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React + Vite | Fast, component-based UI |
| Backend | FastAPI (Python) | Async, high-performance API |
| Database | PostgreSQL + pgvector | Vector similarity search |
| Embeddings | sentence-transformers | Free, local embedding model |
| LLM | Claude (claude-sonnet-4-6) | Concept extraction + question generation |
| Spaced Repetition | SM-2 Algorithm | Same algorithm used by Anki |
| Containerization | Docker + docker-compose | One-command setup |

---

## Architecture

```
User → React Frontend
          ↓
      FastAPI Backend
          ↓
   ┌──────────────────────────┐
   │                          │
   ▼                          ▼
PostgreSQL + pgvector     Claude API
(documents, concepts,     (concept extraction,
 embeddings, SM-2 data)    question generation,
                           answer evaluation)
```

### RAG Pipeline

When generating a quiz question:

1. Retrieve the concept's embedding from pgvector
2. Find the 3 most semantically similar concepts using cosine similarity
3. Send concept + related context to Claude
4. Claude generates a question grounded in the actual study material

---

## Key Technical Decisions

**Why sentence-transformers instead of OpenAI embeddings?**
Eliminates per-request API costs and reduces latency. The tradeoff is slightly lower embedding quality, but `all-MiniLM-L6-v2` performs well for educational content similarity.

**Why SM-2 instead of a simpler scheduling algorithm?**
SM-2 is battle-tested (used by Anki with millions of users) and adapts per-card based on individual performance history. A fixed interval schedule would waste time on concepts the user already knows well.

**Why RAG instead of just prompting Claude directly?**
Grounding questions in the user's actual study material produces more relevant, accurate questions. Without RAG, Claude generates generic questions that may not reflect what the user actually studied.

---

## Features

- Upload text or PDF — AI extracts 3-8 key concepts automatically
- Spaced repetition scheduling (SM-2) — review at the optimal time
- Active recall — type your answer before seeing the correct one
- AI feedback — Claude evaluates your answer and gives specific feedback
- Deep dive — get a deeper explanation of any concept on demand
- Study history — manage all your uploaded material
- Per-document review — choose which topic to review

---

## Local Development

### Prerequisites

- Docker Desktop
- Node.js 18+
- Anthropic API key

### Setup

**1. Clone the repository**

```bash
git clone https://github.com/Aiswaryaa04/Learning-retention-engine.git
cd Learning-retention-engine
```

**2. Create environment file**

```bash
cp .env.example .env
```

Add your `ANTHROPIC_API_KEY` to the `.env` file.

**3. Start the backend and database**

```bash
docker-compose up --build
```

**4. Start the frontend**

```bash
cd frontend
npm install
npm run dev
```

**5. Open the app**

Go to `http://localhost:5173`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/documents` | Upload text and extract concepts |
| POST | `/api/v1/documents/upload-pdf` | Upload PDF and extract concepts |
| GET | `/api/v1/documents` | List all documents |
| GET | `/api/v1/documents/{id}/concepts` | Get concepts for a document |
| DELETE | `/api/v1/documents/{id}` | Delete document and all data |
| PATCH | `/api/v1/documents/{id}` | Update document title |
| GET | `/api/v1/reviews/due` | Get all cards due for review |
| GET | `/api/v1/reviews/due/{document_id}` | Get due cards for a specific document |
| GET | `/api/v1/reviews/{card_id}/question` | Generate AI question via RAG |
| POST | `/api/v1/reviews/{card_id}/submit` | Submit review and update SM-2 |
| POST | `/api/v1/reviews/{card_id}/evaluate` | AI evaluates user's answer |
| GET | `/api/v1/reviews/{card_id}/brushup` | Get deep concept explanation |

---

## Project Structure

```
learning-retention-engine/
├── backend/
│   ├── app/
│   │   ├── api/routes/            # FastAPI route handlers
│   │   ├── core/                  # Config and settings
│   │   ├── db/                    # Database connection
│   │   ├── models/                # SQLAlchemy table definitions
│   │   ├── schemas/               # Pydantic validation schemas
│   │   └── services/
│   │       ├── claude_service.py      # Claude API integration
│   │       ├── embedding_service.py   # sentence-transformers
│   │       ├── rag_service.py         # Vector similarity search
│   │       ├── sm2_service.py         # Spaced repetition algorithm
│   │       └── question_service.py    # Question + feedback generation
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── App.jsx            # Main app with all views
│       ├── History.jsx        # Library management
│       └── api.js             # Backend API client
├── docker-compose.yml
└── README.md
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |