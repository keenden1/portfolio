begin;

-- Reuses chat_config's existing admin-only read/write policies.
alter table public.chat_config
  add column if not exists assistant_rules text not null default '';
alter table public.chat_config drop constraint if exists chat_config_assistant_rules_length;
alter table public.chat_config add constraint chat_config_assistant_rules_length
  check (char_length(assistant_rules) <= 4000);

notify pgrst, 'reload schema';
commit;
