# 🧠 Learning Retention Engine

**Live Demo → [learning-retention-engine.vercel.app](https://learning-retention-engine.vercel.app)**

---

## The Problem

You read an article. You watch a lecture. You take notes. A week later — it's gone.

The traditional way to study is passive: read, highlight, maybe re-read. Research consistently shows this doesn't work. Information decays rapidly after you first encounter it, following what psychologists call the **forgetting curve**. Within a week, most people forget 70% of what they read.

The solution isn't to study more. It's to study at the right time, and to study actively.

**Active recall** — forcing yourself to retrieve information — is 2-3x more effective than re-reading. **Spaced repetition** — reviewing material right before you forget it — makes retention exponential rather than linear.

The problem is that both require significant manual effort: creating flashcards, scheduling reviews, tracking what you know. Most people don't do it, not because they don't want to, but because the friction is too high.

---

## What I Built

A full-stack AI application that removes all that friction.

You paste any text or upload any PDF. The app does the rest — extracting what matters, quizzing you on it, and bringing it back at exactly the right time before you forget it.

---

## How It Works

### 1. Intelligent Concept Extraction
Upload any study material — lecture notes, a research paper, a book chapter, anything. Claude AI reads it and extracts the 3-8 most important concepts, each with a clear explanation. No manual flashcard creation.

### 2. Vector Embeddings for Semantic Understanding
Each concept is converted into a 384-dimensional vector embedding and stored in PostgreSQL using the pgvector extension. This allows the app to understand *meaning*, not just keywords — finding related concepts even when the wording is different.

### 3. RAG-Powered Question Generation
When it's time to review, the app doesn't just ask generic questions. It uses **Retrieval Augmented Generation (RAG)** — finding the most semantically similar concepts from your library using cosine similarity search, then sending that context to Claude to generate questions grounded in *your actual material*.

### 4. Active Recall with AI Feedback
You type your answer before seeing the correct one. Claude then evaluates your specific response — telling you exactly what you got right, what you missed, and giving you a memorable tip to retain the concept. This is fundamentally different from passive flashcard review.

### 5. SM-2 Spaced Repetition Scheduling
After each review, the SM-2 algorithm (the same algorithm Anki uses) calculates when you should see this concept again. Answer perfectly — you won't see it for weeks. Struggle — it comes back tomorrow. The schedule adapts to your performance on every individual concept.

### 6. Forgetting Risk Dashboard
The dashboard shows which concepts are at risk of being forgotten, color-coded by urgency — before you've actually forgotten them. This is the proactive layer that keeps your retention from slipping between sessions.

---

## Technical Architecture

```
React Frontend (Vercel)
        ↓
FastAPI Backend (Render)
        ↓              ↓
PostgreSQL          Claude API
+ pgvector         (Anthropic)
(Supabase)
```

| Layer | Technology | Decision |
|---|---|---|
| Frontend | React + Vite | Component-based, fast dev server |
| Backend | FastAPI (Python) | Async-native, auto-generates API docs |
| Database | PostgreSQL + pgvector | Vector similarity search alongside relational data |
| Embeddings | Custom hash-based embedder | Eliminated memory constraints of ML models on free hosting |
| LLM | Claude claude-sonnet-4-6 | Concept extraction, question generation, answer evaluation |
| Algorithm | SM-2 | Battle-tested, adapts per-card based on performance history |
| Containerization | Docker | Reproducible builds, one-command local setup |

---

## Key Technical Decisions

**Why RAG instead of just prompting Claude directly?**
Without RAG, Claude generates questions from its general training data. With RAG, it generates questions based on the specific content the user uploaded — the exact examples, analogies, and explanations they studied. This makes every question relevant and grounded.

**Why pgvector over a dedicated vector database like Pinecone?**
Keeping everything in one PostgreSQL database reduces infrastructure complexity significantly. pgvector gives vector similarity search alongside relational data without managing a separate service — the right tradeoff for this scale.

**Why SM-2 over a simpler scheduling algorithm?**
SM-2 adapts per-card based on individual performance history. A fixed interval schedule would waste time on concepts the user already knows well. SM-2 is also the algorithm behind Anki — used by millions of students for decades — which validates the approach.

**Why active recall over traditional flashcards?**
Cognitive science research consistently shows that retrieving information (active recall) is significantly more effective for long-term retention than passively re-reading or flipping flashcards. Making users write their answer before seeing the correct one forces genuine retrieval, not recognition.

---

## Features

- Upload text or PDF — AI extracts key concepts automatically
- RAG-powered quiz questions grounded in your study material
- Write your answer before seeing the correct one
- Claude evaluates your answer and gives specific, personalized feedback
- SM-2 algorithm schedules reviews at the optimal time
- Forgetting risk dashboard — know what you're about to forget before you forget it
- Deep dive explanations for any concept on demand
- Study history — manage all uploaded material with edit and delete
- Review by specific topic or review everything due today

---

## Stack

`Python` `FastAPI` `React` `PostgreSQL` `pgvector` `Docker` `Claude AI` `Supabase` `Vercel` `Render`

---

**Live Demo → [learning-retention-engine.vercel.app](https://learning-retention-engine.vercel.app)**

*Built by Aiswaryaa — [GitHub](https://github.com/Aiswaryaa04/Learning-retention-engine)*