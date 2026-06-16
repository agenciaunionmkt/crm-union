-- ============================================================
-- Migração: novo status "aprovado" nas demandas
-- entregue = aguardando aprovação do cliente (azul)
-- aprovado = aprovado pelo cliente (verde)
-- Rode no Supabase: SQL Editor > New query > cole > Run
-- ============================================================

alter table demands drop constraint if exists demands_status_check;
alter table demands add constraint demands_status_check
  check (status in ('a_fazer', 'em_andamento', 'em_revisao', 'entregue', 'aprovado'));

notify pgrst, 'reload schema';
