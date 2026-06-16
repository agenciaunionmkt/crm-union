-- ============================================================
-- Migração: anexos em mensagens de chat e em solicitações
-- Rode no Supabase: SQL Editor > New query > cole > Run
-- Idempotente.
-- ============================================================

alter table chat_messages add column if not exists arquivo_url text;
alter table chat_messages add column if not exists nome_arquivo text;

alter table client_requests add column if not exists arquivo_url text;
alter table client_requests add column if not exists nome_arquivo text;

notify pgrst, 'reload schema';
