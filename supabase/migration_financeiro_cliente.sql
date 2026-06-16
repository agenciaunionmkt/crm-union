-- ============================================================
-- Migração: vincula lançamento financeiro ao cliente
-- (permite o cliente acompanhar suas cobranças no portal)
-- Rode no Supabase: SQL Editor > New query > cole > Run
-- Idempotente.
-- ============================================================

alter table financial_entries add column if not exists cliente_id uuid references clients (id) on delete set null;
create index if not exists financial_entries_cliente_idx on financial_entries (cliente_id);

notify pgrst, 'reload schema';
