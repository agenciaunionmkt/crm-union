-- ============================================================
-- Migração: integração Asaas (cobranças e assinaturas)
-- Rode no Supabase: SQL Editor > New query > cole > Run
-- Idempotente.
-- ============================================================

-- Vínculo do cliente com o Asaas
alter table clients add column if not exists asaas_customer_id text;
alter table clients add column if not exists asaas_subscription_id text;

-- Cobrança vinculada ao lançamento financeiro
alter table financial_entries add column if not exists asaas_payment_id text;
alter table financial_entries add column if not exists link_pagamento text;

create index if not exists financial_entries_asaas_idx on financial_entries (asaas_payment_id);

notify pgrst, 'reload schema';
