-- ============================================================
-- Anexos internos (referências da equipe) vs criativos do cliente
-- Rode no Supabase: SQL Editor > New query > cole > Run
-- ============================================================

alter table attachments add column if not exists interno boolean not null default false;

-- Cliente só enxerga anexos não-internos das suas demandas
drop policy if exists attachments_own_select on public.attachments;
create policy attachments_own_select on public.attachments for select to authenticated
  using (
    interno = false
    and demand_id in (select id from public.demands where cliente_id = my_cliente_id())
  );

notify pgrst, 'reload schema';
