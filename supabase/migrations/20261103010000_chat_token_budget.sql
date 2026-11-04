begin;

create table if not exists public.chat_config (
  id integer primary key check (id = 1),
  daily_token_limit integer not null default 50000 check (daily_token_limit between 0 and 10000000)
);
alter table public.chat_config add column if not exists gemini_enabled boolean not null default true;
insert into public.chat_config (id) values (1) on conflict do nothing;
create table if not exists public.chat_daily_usage (
  day date primary key,
  used_tokens bigint not null default 0 check (used_tokens >= 0),
  reserved_tokens bigint not null default 0 check (reserved_tokens >= 0)
);
create table if not exists public.chat_token_reservations (
  id uuid primary key default gen_random_uuid(),
  day date not null references public.chat_daily_usage(day),
  tokens integer not null check (tokens > 0),
  settled boolean not null default false
);
alter table public.chat_config enable row level security;
alter table public.chat_daily_usage enable row level security;
alter table public.chat_token_reservations enable row level security;
drop policy if exists "Admins read chat config" on public.chat_config;
create policy "Admins read chat config" on public.chat_config for select to authenticated using ((select public.is_admin()));
drop policy if exists "Admins update chat config" on public.chat_config;
create policy "Admins update chat config" on public.chat_config for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
grant select, update on public.chat_config to authenticated;
grant all on public.chat_config, public.chat_daily_usage, public.chat_token_reservations to service_role;

create or replace function public.reserve_chat_tokens(amount integer) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  today date := (now() at time zone 'Asia/Singapore')::date;
  daily_limit integer;
  reservation uuid;
begin
  if amount is null or amount <= 0 or amount > 2000000 then raise exception 'Invalid reservation'; end if;
  select daily_token_limit into daily_limit from public.chat_config where id = 1 and gemini_enabled for share;
  if daily_limit is null or daily_limit < amount then return null; end if;
  insert into public.chat_daily_usage(day) values(today) on conflict do nothing;
  update public.chat_daily_usage set reserved_tokens = reserved_tokens + amount
    where day = today and used_tokens + reserved_tokens + amount <= daily_limit;
  if not found then return null; end if;
  insert into public.chat_token_reservations(day, tokens) values(today, amount) returning id into reservation;
  return reservation;
end;
$$;

create or replace function public.settle_chat_tokens(reservation_id uuid, actual_tokens integer) returns void
language plpgsql security definer set search_path = public as $$
declare reservation public.chat_token_reservations;
begin
  if actual_tokens is null or actual_tokens < 0 or actual_tokens > 2000000 then raise exception 'Invalid usage'; end if;
  select * into reservation from public.chat_token_reservations where id = reservation_id for update;
  if not found or reservation.settled then return; end if;
  update public.chat_daily_usage set reserved_tokens = reserved_tokens - reservation.tokens,
    used_tokens = used_tokens + actual_tokens where day = reservation.day;
  update public.chat_token_reservations set settled = true where id = reservation_id;
end;
$$;

create or replace function public.chat_budget_status() returns jsonb
language plpgsql security definer set search_path = public as $$
declare result jsonb;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  select jsonb_build_object('enabled', c.gemini_enabled, 'limit', c.daily_token_limit, 'used', coalesce(u.used_tokens, 0),
    'reserved', coalesce(u.reserved_tokens, 0), 'day', (now() at time zone 'Asia/Singapore')::date)
    into result from public.chat_config c left join public.chat_daily_usage u
    on u.day = (now() at time zone 'Asia/Singapore')::date where c.id = 1;
  return result;
end;
$$;
revoke all on function public.reserve_chat_tokens(integer), public.settle_chat_tokens(uuid, integer), public.chat_budget_status() from public, anon, authenticated;
grant execute on function public.reserve_chat_tokens(integer), public.settle_chat_tokens(uuid, integer) to service_role;
grant execute on function public.chat_budget_status() to authenticated;
notify pgrst, 'reload schema';
commit;
