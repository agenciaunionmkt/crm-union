-- ============================================================
-- Migração: agendamento de reuniões
-- Rode no Supabase: SQL Editor > New query > cole > Run
-- ============================================================

create table if not exists reunioes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clients (id) on delete cascade,
  titulo text not null,
  descricao text,
  inicio timestamptz not null,
  link text,
  criado_por uuid references users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists reunioes_inicio_idx on reunioes (inicio);
create index if not exists reunioes_cliente_idx on reunioes (cliente_id);

-- RLS: equipe acesso total; cliente vê só as reuniões vinculadas a ele
alter table reunioes enable row level security;

drop policy if exists reunioes_staff on reunioes;
create policy reunioes_staff on reunioes for all to authenticated
  using (is_staff()) with check (is_staff());

drop policy if exists reunioes_own_select on reunioes;
create policy reunioes_own_select on reunioes for select to authenticated
  using (cliente_id = my_cliente_id());

notify pgrst, 'reload schema';
