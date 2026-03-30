# NeuroNotes

NeuroNotes is a full-stack AI second brain for students. It combines notes, retrieval-augmented chat, and study tools (summaries, MCQs, flashcards, viva questions) in one app.

## Tech Stack

- Next.js (App Router) + React + TypeScript
- Supabase (Auth + Postgres)
- pgvector for semantic retrieval
- OpenRouter for LLM + embedding models
- Tailwind CSS

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root and add:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   OPENROUTER_API_KEY=
   OPENROUTER_CHAT_MODEL=
   OPENROUTER_EMBEDDING_MODEL=
   NEXT_PUBLIC_SITE_URL=
   ```
3. Run the SQL from `supabase/schema.sql` in your Supabase SQL editor.
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`.

## Available Scripts

- `npm run dev` - start local development server
- `npm run build` - create production build
- `npm run start` - run production server
- `npm run lint` - run linting
- `npm run typecheck` - run TypeScript checks

## Current Features

- Google OAuth authentication with protected routes
- Notes CRUD and document ingestion
- Embedding generation + chunk retrieval pipeline
- RAG chat over your notes
- AI study tools:
  - summarization
  - MCQ generation
  - flashcards
  - viva questions
- Dashboard, Notes, Chat, Quiz, and Analytics pages
