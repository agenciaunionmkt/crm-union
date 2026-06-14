-- ============================================================
-- Migração: plano do cliente (define posts/mês)
-- Rode no Supabase: SQL Editor > New query > cole > Run
-- ============================================================

alter table clients add column if not exists plano text
  check (plano in ('essencial', 'master', 'premium') or plano is null);

notify pgrst, 'reload schema';
