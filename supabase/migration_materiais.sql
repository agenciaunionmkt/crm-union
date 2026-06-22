-- ============================================================
-- Migração: materiais do cliente (logo, fotos, PDFs, etc.)
-- Rode no Supabase: SQL Editor > New query > cole > Run
-- ============================================================

create table if not exists materiais (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clients (id) on delete cascade,
  nome_arquivo text not null,
  arquivo_url text not null,
  enviado_por uuid references users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists materiais_cliente_idx on materiais (cliente_id, created_at desc);

-- RLS: equipe acesso total; cliente só os próprios materiais
alter table materiais enable row level security;

drop policy if exists materiais_staff on materiais;
create policy materiais_staff on materiais for all to authenticated
  using (is_staff()) with check (is_staff());

drop policy if exists materiais_own_select on materiais;
create policy materiais_own_select on materiais for select to authenticated
  using (cliente_id = my_cliente_id());

drop policy if exists materiais_own_insert on materiais;
create policy materiais_own_insert on materiais for insert to authenticated
  with check (cliente_id = my_cliente_id());

drop policy if exists materiais_own_delete on materiais;
create policy materiais_own_delete on materiais for delete to authenticated
  using (cliente_id = my_cliente_id());

notify pgrst, 'reload schema';
