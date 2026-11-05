begin;
alter table public.chat_config add column if not exists model_order text[] not null
  default array['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
alter table public.chat_config drop constraint if exists chat_config_model_order_check;
alter table public.chat_config add constraint chat_config_model_order_check check (
  cardinality(model_order) between 1 and 4 and array_position(model_order, null) is null
  and model_order <@ array['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-flash-lite']::text[]
);
notify pgrst, 'reload schema';
commit;
