-- ============================================================
-- Migração: CNPJ e endereço da tabela clients
-- Rode no Supabase: SQL Editor > New query > cole > Run
-- Idempotente: pode rodar mais de uma vez sem erro.
-- ============================================================

alter table clients add column if not exists cnpj text;
alter table clients add column if not exists endereco text;

notify pgrst, 'reload schema';
