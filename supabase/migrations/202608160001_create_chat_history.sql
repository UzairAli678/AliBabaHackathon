create extension if not exists pgcrypto;

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) > 0),
  emergency_detected boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists chat_sessions_user_updated_idx on public.chat_sessions (user_id, updated_at desc);
create index if not exists chat_messages_session_created_idx on public.chat_messages (session_id, created_at asc);

alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

create policy "Users manage their own chat sessions" on public.chat_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read their own chat messages" on public.chat_messages for select using (exists (select 1 from public.chat_sessions where chat_sessions.id = chat_messages.session_id and chat_sessions.user_id = auth.uid()));
create policy "Users add messages to their own chat sessions" on public.chat_messages for insert with check (exists (select 1 from public.chat_sessions where chat_sessions.id = chat_messages.session_id and chat_sessions.user_id = auth.uid()));
create policy "Users delete messages from their own chat sessions" on public.chat_messages for delete using (exists (select 1 from public.chat_sessions where chat_sessions.id = chat_messages.session_id and chat_sessions.user_id = auth.uid()));
