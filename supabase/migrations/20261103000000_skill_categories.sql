begin;

alter table public.skills add column if not exists category text;

update public.skills
set category = case
  when label ~* 'database|firebase|sql|supabase|mongo|redis|backend|rest|api'
    then 'databases_backend'
  else 'languages_frameworks'
end
where category is null;

alter table public.skills alter column category set default 'languages_frameworks';
alter table public.skills alter column category set not null;
alter table public.skills drop constraint if exists skills_category_check;
alter table public.skills add constraint skills_category_check
  check (category in ('languages_frameworks', 'databases_backend'));

notify pgrst, 'reload schema';
commit;
