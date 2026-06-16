-- ============================================================
-- Migração: Row-Level Security (RLS) + políticas de acesso
--
-- ⚠️ ANTES DE RODAR: adicione SUPABASE_SERVICE_ROLE_KEY no Vercel e faça redeploy.
-- As funções serverless (webhooks Asaas/Autentique, cobranças) precisam dela
-- para gravar no banco com o RLS ligado (a service_role ignora o RLS).
--
-- Modelo:
--   equipe (admin/equipe) = acesso total
--   cliente = somente os próprios dados (vinculados ao seu cliente_id)
--   anônimo = nada
-- ============================================================

-- ---------- Funções auxiliares ----------
-- SECURITY DEFINER: leem a tabela users ignorando o RLS (evita recursão).
create or replace function public.is_staff()
  returns boolean language sql stable security definer set search_path = public as $$
    select exists (
      select 1 from public.users where id = auth.uid() and papel in ('admin','equipe')
    )
  $$;

create or replace function public.my_cliente_id()
  returns uuid language sql stable security definer set search_path = public as $$
    select cliente_id from public.users where id = auth.uid()
  $$;

-- ============================================================
-- users
-- ============================================================
alter table public.users enable row level security;
drop policy if exists users_staff on public.users;
create policy users_staff on public.users for all to authenticated
  using (is_staff()) with check (is_staff());
drop policy if exists users_self_or_staff_select on public.users;
create policy users_self_or_staff_select on public.users for select to authenticated
  using (id = auth.uid() or papel in ('admin','equipe'));
-- Sem política de update para o próprio usuário: evita que um cliente altere o
-- próprio papel (escalada de privilégio). A gestão de usuários é feita pela equipe.
drop policy if exists users_self_update on public.users;

-- ============================================================
-- clients
-- ============================================================
alter table public.clients enable row level security;
drop policy if exists clients_staff on public.clients;
create policy clients_staff on public.clients for all to authenticated
  using (is_staff()) with check (is_staff());
drop policy if exists clients_own_select on public.clients;
create policy clients_own_select on public.clients for select to authenticated
  using (id = my_cliente_id());

-- ============================================================
-- demands  (cliente vê e pode aprovar as suas)
-- ============================================================
alter table public.demands enable row level security;
drop policy if exists demands_staff on public.demands;
create policy demands_staff on public.demands for all to authenticated
  using (is_staff()) with check (is_staff());
drop policy if exists demands_own_select on public.demands;
create policy demands_own_select on public.demands for select to authenticated
  using (cliente_id = my_cliente_id());
drop policy if exists demands_own_update on public.demands;
create policy demands_own_update on public.demands for update to authenticated
  using (cliente_id = my_cliente_id()) with check (cliente_id = my_cliente_id());

-- ============================================================
-- comments  (cliente vê/insere só comentários externos das suas demandas)
-- ============================================================
alter table public.comments enable row level security;
drop policy if exists comments_staff on public.comments;
create policy comments_staff on public.comments for all to authenticated
  using (is_staff()) with check (is_staff());
drop policy if exists comments_own_select on public.comments;
create policy comments_own_select on public.comments for select to authenticated
  using (
    interno = false
    and demand_id in (select id from public.demands where cliente_id = my_cliente_id())
  );
drop policy if exists comments_own_insert on public.comments;
create policy comments_own_insert on public.comments for insert to authenticated
  with check (
    interno = false
    and autor_id = auth.uid()
    and demand_id in (select id from public.demands where cliente_id = my_cliente_id())
  );

-- ============================================================
-- attachments  (cliente vê anexos das suas demandas)
-- ============================================================
alter table public.attachments enable row level security;
drop policy if exists attachments_staff on public.attachments;
create policy attachments_staff on public.attachments for all to authenticated
  using (is_staff()) with check (is_staff());
drop policy if exists attachments_own_select on public.attachments;
create policy attachments_own_select on public.attachments for select to authenticated
  using (demand_id in (select id from public.demands where cliente_id = my_cliente_id()));

-- ============================================================
-- chat_messages  (cliente vê/insere as suas)
-- ============================================================
alter table public.chat_messages enable row level security;
drop policy if exists chat_staff on public.chat_messages;
create policy chat_staff on public.chat_messages for all to authenticated
  using (is_staff()) with check (is_staff());
drop policy if exists chat_own_select on public.chat_messages;
create policy chat_own_select on public.chat_messages for select to authenticated
  using (cliente_id = my_cliente_id());
drop policy if exists chat_own_insert on public.chat_messages;
create policy chat_own_insert on public.chat_messages for insert to authenticated
  with check (cliente_id = my_cliente_id() and autor_id = auth.uid());

-- ============================================================
-- client_requests  (cliente vê/insere as suas)
-- ============================================================
alter table public.client_requests enable row level security;
drop policy if exists req_staff on public.client_requests;
create policy req_staff on public.client_requests for all to authenticated
  using (is_staff()) with check (is_staff());
drop policy if exists req_own_select on public.client_requests;
create policy req_own_select on public.client_requests for select to authenticated
  using (cliente_id = my_cliente_id());
drop policy if exists req_own_insert on public.client_requests;
create policy req_own_insert on public.client_requests for insert to authenticated
  with check (cliente_id = my_cliente_id() and criado_por = auth.uid());

-- ============================================================
-- contratos  (cliente vê os seus)
-- ============================================================
alter table public.contratos enable row level security;
drop policy if exists contratos_staff on public.contratos;
create policy contratos_staff on public.contratos for all to authenticated
  using (is_staff()) with check (is_staff());
drop policy if exists contratos_own_select on public.contratos;
create policy contratos_own_select on public.contratos for select to authenticated
  using (cliente_id = my_cliente_id());

-- ============================================================
-- financial_entries  (cliente vê as suas cobranças)
-- ============================================================
alter table public.financial_entries enable row level security;
drop policy if exists fin_staff on public.financial_entries;
create policy fin_staff on public.financial_entries for all to authenticated
  using (is_staff()) with check (is_staff());
drop policy if exists fin_own_select on public.financial_entries;
create policy fin_own_select on public.financial_entries for select to authenticated
  using (cliente_id = my_cliente_id());

-- ============================================================
-- notifications  (cada usuário vê/atualiza as suas)
-- ============================================================
alter table public.notifications enable row level security;
drop policy if exists notif_staff on public.notifications;
create policy notif_staff on public.notifications for all to authenticated
  using (is_staff()) with check (is_staff());
drop policy if exists notif_own on public.notifications;
create policy notif_own on public.notifications for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- Tabelas só da equipe (cliente não acessa)
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array['briefings','plans','tags','demand_tags','approvals','reports']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t||'_staff', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (is_staff()) with check (is_staff());',
      t||'_staff', t
    );
  end loop;
end $$;

notify pgrst, 'reload schema';
