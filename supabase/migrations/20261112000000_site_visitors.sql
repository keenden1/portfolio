begin;

create table if not exists public.site_visitors (
  ip_hash text primary key check (ip_hash ~ '^[a-f0-9]{64}$'),
  first_seen_at timestamptz not null default now()
);
alter table public.site_visitors enable row level security;
revoke all on public.site_visitors from public, anon, authenticated;
grant all on public.site_visitors to service_role;

-- Return only the count, without exposing visitor identifiers to browsers.
create or replace function public.site_visitor_count()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  return (select count(*) from public.site_visitors);
end;
$$;
revoke all on function public.site_visitor_count() from public, anon;
grant execute on function public.site_visitor_count() to authenticated;

notify pgrst, 'reload schema';
commit;
