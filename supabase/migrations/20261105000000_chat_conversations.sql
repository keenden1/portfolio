begin;
create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  created_at timestamptz not null default now(),
  question text not null check (char_length(question) between 1 and 500),
  answer text not null check (char_length(answer) <= 20000),
  source text not null check (source in ('local', 'gemini'))
);
create index if not exists chat_conversations_session_time
  on public.chat_conversations (conversation_id, created_at);
alter table public.chat_conversations enable row level security;
revoke all on public.chat_conversations from anon, authenticated;
grant select on public.chat_conversations to authenticated;
grant all on public.chat_conversations to service_role;
create policy "Admins read conversations" on public.chat_conversations
  for select to authenticated using ((select public.is_admin()));
notify pgrst, 'reload schema';
commit;
