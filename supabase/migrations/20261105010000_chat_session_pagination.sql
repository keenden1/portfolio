begin;
create index if not exists chat_conversations_session_order
  on public.chat_conversations (conversation_id, created_at desc, id desc);

-- One summary per session; invoker security preserves admin-only table RLS.
create or replace function public.admin_chat_sessions(search_text text default '', page_number integer default 0)
returns table (conversation_id uuid, first_question text, latest_at timestamptz, exchange_count bigint)
language plpgsql stable security invoker set search_path = public as $$
begin
  if not coalesce(public.is_admin(), false) then raise exception 'Admin access required'; end if;
  if page_number is null or page_number < 0 or page_number > 1000000 then raise exception 'Invalid page'; end if;
  if char_length(coalesce(search_text, '')) > 500 then raise exception 'Search is too long'; end if;
  return query
    with sessions as (
      select c.conversation_id as session_id, max(c.created_at) as latest, count(*) as exchanges
      from public.chat_conversations c
      group by c.conversation_id
      having coalesce(btrim(search_text), '') = ''
        or strpos(c.conversation_id::text, lower(btrim(search_text))) > 0
        or bool_or(strpos(lower(c.question), lower(btrim(search_text))) > 0
          or strpos(lower(c.answer), lower(btrim(search_text))) > 0)
      order by latest desc, session_id desc
      limit 21 offset (page_number::bigint * 20)
    )
    select s.session_id, first_message.question, s.latest, s.exchanges
    from sessions s
    cross join lateral (
      select c.question from public.chat_conversations c
      where c.conversation_id = s.session_id
      order by c.created_at, c.id limit 1
    ) first_message
    order by s.latest desc, s.session_id desc;
end;
$$;
revoke all on function public.admin_chat_sessions(text, integer) from public, anon, authenticated;
grant execute on function public.admin_chat_sessions(text, integer) to authenticated;
notify pgrst, 'reload schema';
commit;
