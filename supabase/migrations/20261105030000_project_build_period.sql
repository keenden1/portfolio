begin;
alter table public.projects add column if not exists built_end_date date;
alter table public.projects add constraint projects_build_period_order
  check (built_end_date is null or (built_date is not null and built_end_date >= built_date));
notify pgrst, 'reload schema';
commit;
