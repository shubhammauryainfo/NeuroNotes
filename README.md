# NeuroNotes

NeuroNotes is a full-stack AI second brain for students built with Next.js, Supabase, pgvector, and OpenRouter.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in your Supabase and OpenRouter keys.
3. Run the SQL in `supabase/schema.sql` inside the Supabase SQL editor.
4. Install dependencies with `npm install`.
5. Start the app with `npm run dev`.

## Implemented in this milestone

- Next.js App Router scaffold with neobrutalist UI system
- Supabase Google OAuth flow and protected routes
- Notes CRUD server actions and API routes
- Chunking plus embedding creation hooks
- RAG query pipeline against pgvector via `match_note_chunks`
- AI study tools for summaries, MCQs, flashcards, and viva questions
- Dashboard, Notes, Chat, and Analytics pages
