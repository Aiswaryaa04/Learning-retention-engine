# Retention

> AI-powered spaced repetition learning — built from scratch.

**Live → [learning-retention-engine.vercel.app](https://learning-retention-engine.vercel.app)**

---

## The Problem

Most people study wrong.

They re-read notes, highlight textbooks, watch lectures — then forget 70% of it within a week. This isn't laziness. It's biology. Our brains discard information that isn't reinforced at the right time.

Two techniques are proven to fix this:

**Active recall** — forcing yourself to retrieve information from memory, rather than passively re-reading it. Studies show this is 2-3x more effective for long-term retention.

**Spaced repetition** — reviewing material at increasing intervals, right before you'd forget it. Instead of cramming everything the night before, you review a concept once today, again in 3 days, then in 2 weeks, then in a month.

The problem is that doing both manually is too much friction. You have to create flashcards, schedule reviews, track what you know vs what you're forgetting. Most people don't bother.

**Retention removes that friction entirely.**

---

## What It Does

Upload any study material — notes, a PDF, a book chapter, anything. Retention reads it, extracts the key concepts automatically, and builds a review schedule tailored to your performance.

When it's time to review, it doesn't just show you a flashcard. It generates a question grounded in your specific material, makes you write an answer, evaluates what you got right and wrong, and schedules the next review based on how well you did.

Come back the next day — only the concepts you're about to forget are waiting for you.

---

## How It Works

### Step 1 — Upload
Paste text or upload a PDF. Claude AI reads the content and extracts 3-8 key concepts with clear explanations. No manual flashcard creation.

### Step 2 — Study (optional)
Before the quiz starts, browse all extracted concepts one by one. Read, understand, then move to the quiz when ready.

### Step 3 — Active Recall
For each concept, a question is generated — not from Claude's general knowledge, but from your specific material using a RAG pipeline. You type your answer before seeing the correct one.

### Step 4 — AI Feedback
Claude reads your answer and tells you exactly what you got right, what you missed, and gives you a memorable tip. This is meaningfully different from flipping a flashcard and deciding "yeah I knew that."

### Step 5 — Scheduling
You grade yourself (Forgot / Hard / Good / Easy). The SM-2 algorithm calculates when you should see this concept again — tomorrow if you struggled, weeks later if you aced it.

### Step 6 — Forgetting Risk
The dashboard shows which concepts are at risk of being forgotten before you've actually forgotten them. Red means review now. Green means you're safe.

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

### The RAG Pipeline

Standard AI flashcard apps generate questions using Claude's general training data. Retention does something different.

When it's time to quiz you on a concept, it:
1. Takes that concept's vector embedding
2. Searches the database for the 3 most semantically similar concepts using cosine similarity
3. Sends those related concepts as context to Claude
4. Claude generates a question grounded in *your actual study material*

The result is questions that are specific to what you studied — not generic questions about the topic.

### The SM-2 Algorithm

After each review, three values update per concept:

- `interval` — days until next review
- `easiness_factor` — how easy this card is (min 1.3, default 2.5)
- `repetitions` — successful review streak

Score below 3 (forgot it) → interval resets to 1 day. Score 3-5 → interval multiplies by easiness factor. Over time, concepts you know well disappear for weeks. Concepts you struggle with come back daily.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | FastAPI (Python) |
| Database | PostgreSQL + pgvector |
| LLM | Claude claude-sonnet-4-6 (Anthropic) |
| Algorithm | SM-2 Spaced Repetition |
| Hosting | Vercel + Render + Supabase |
| Container | Docker |

---

## Key Decisions

**pgvector over Pinecone**
Keeping vector search inside PostgreSQL eliminates a separate service. The tradeoff is slightly less performance at massive scale — acceptable for this use case.

**SM-2 over a custom algorithm**
SM-2 is battle-tested with millions of Anki users over decades. Building a custom algorithm would require significant training data to validate. SM-2 works.

**Active recall over passive flashcards**
Making users write an answer before seeing the correct one forces genuine memory retrieval. Most flashcard apps let you peek at the answer and convince yourself you knew it. Retention doesn't.

**Claude for answer evaluation**
A simple string comparison can't evaluate whether an answer is conceptually correct. Claude reads the user's response and gives specific, contextual feedback — this is the feature that makes the learning actually work.

---

**Live → [learning-retention-engine.vercel.app](https://learning-retention-engine.vercel.app)**

*GitHub → [Aiswaryaa04/Learning-retention-engine](https://github.com/Aiswaryaa04/Learning-retention-engine)*