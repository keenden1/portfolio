begin;
alter table public.projects add column if not exists built_date date;
comment on column public.projects.built_date is 'Optional project build/completion date shown to portfolio visitors.';
notify pgrst, 'reload schema';
commit;
