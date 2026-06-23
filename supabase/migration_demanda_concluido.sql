-- ============================================================
-- Migração: novo status "concluido" nas demandas
-- (verde distinto de "aprovado"; usado só no painel da equipe)
-- Rode no Supabase: SQL Editor > New query > cole > Run
-- ============================================================

alter table public.demands drop constraint if exists demands_status_check;
alter table public.demands add constraint demands_status_check
  check (status in ('a_fazer', 'em_andamento', 'em_revisao', 'entregue', 'aprovado', 'concluido'));

notify pgrst, 'reload schema';
