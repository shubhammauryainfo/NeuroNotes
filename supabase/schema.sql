create extension if not exists vector;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  subject text,
  topic text,
  created_at timestamptz not null default now()
);

create table if not exists public.note_chunks (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  note_title text,
  subject text,
  topic text,
  content_chunk text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weak_topics text[] not null default '{}',
  strong_topics text[] not null default '{}',
  last_activity timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.notes enable row level security;
alter table public.note_chunks enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.user_profile enable row level security;

create policy "users_select_own_profile"
on public.users for select
using (auth.uid() = id);

create policy "notes_manage_own"
on public.notes for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "note_chunks_manage_own"
on public.note_chunks for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "chats_manage_own"
on public.chats for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "messages_manage_own"
on public.messages for all
using (
  exists (
    select 1
    from public.chats
    where public.chats.id = messages.chat_id
      and public.chats.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.chats
    where public.chats.id = messages.chat_id
      and public.chats.user_id = auth.uid()
  )
);

create policy "user_profile_manage_own"
on public.user_profile for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists notes_user_id_idx on public.notes(user_id);
create index if not exists note_chunks_user_id_idx on public.note_chunks(user_id);
create index if not exists note_chunks_note_id_idx on public.note_chunks(note_id);
create index if not exists chats_user_id_idx on public.chats(user_id);
create index if not exists messages_chat_id_idx on public.messages(chat_id);

create index if not exists note_chunks_embedding_idx
on public.note_chunks using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

create or replace function public.match_note_chunks(
  query_embedding vector(1536),
  match_count int,
  match_user_id uuid
)
returns table (
  id uuid,
  note_id uuid,
  user_id uuid,
  note_title text,
  subject text,
  topic text,
  content_chunk text,
  similarity float
)
language sql
security definer
set search_path = public
as $$
  select
    note_chunks.id,
    note_chunks.note_id,
    note_chunks.user_id,
    note_chunks.note_title,
    note_chunks.subject,
    note_chunks.topic,
    note_chunks.content_chunk,
    1 - (note_chunks.embedding <=> query_embedding) as similarity
  from public.note_chunks
  where note_chunks.user_id = match_user_id
  order by note_chunks.embedding <=> query_embedding
  limit match_count;
$$;
