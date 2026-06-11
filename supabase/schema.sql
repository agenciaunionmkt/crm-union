-- ============================================================
-- Esquema do banco de dados - CRM da Agência
-- Execute este script no SQL Editor do Supabase (Project > SQL Editor)
-- ============================================================

-- Extensão para gerar UUIDs
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Módulo: Clientes
-- ------------------------------------------------------------
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  segmento text,
  contato_email text,
  contato_telefone text,
  created_at timestamptz not null default now()
);

create table if not exists briefings (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null unique references clients (id) on delete cascade,
  tom_de_voz text,
  referencias text,
  regras_marca text,
  updated_at timestamptz not null default now()
);

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clients (id) on delete cascade,
  pacote text not null,
  valor numeric(10, 2),
  inicio date,
  fim date,
  status text not null default 'ativo' check (status in ('ativo', 'pausado', 'encerrado'))
);

-- ------------------------------------------------------------
-- Módulo: Autenticação e usuários
-- A tabela users espelha auth.users, adicionando papel e vínculo com cliente.
-- ------------------------------------------------------------
create table if not exists users (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text not null unique,
  papel text not null check (papel in ('admin', 'equipe', 'cliente')),
  cliente_id uuid references clients (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Módulo: Demandas
-- ------------------------------------------------------------
create table if not exists demands (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clients (id) on delete cascade,
  titulo text not null,
  descricao text,
  status text not null default 'a_fazer'
    check (status in ('a_fazer', 'em_andamento', 'em_revisao', 'entregue')),
  prazo date,
  responsavel_id uuid references users (id) on delete set null,
  created_by uuid references users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  cor text not null default '#888888'
);

create table if not exists demand_tags (
  demand_id uuid not null references demands (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  primary key (demand_id, tag_id)
);

create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null references demands (id) on delete cascade,
  arquivo_url text not null,
  nome_arquivo text,
  enviado_por uuid references users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null references demands (id) on delete cascade,
  autor_id uuid references users (id) on delete set null,
  mensagem text not null,
  interno boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Módulo: Portal do cliente e relatórios
-- ------------------------------------------------------------
create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null references demands (id) on delete cascade,
  status text not null default 'pendente'
    check (status in ('pendente', 'aprovado', 'revisao_solicitada')),
  feedback text,
  reviewed_at timestamptz
);

create table if not exists client_requests (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clients (id) on delete cascade,
  criado_por uuid references users (id) on delete set null,
  titulo text not null,
  descricao text,
  status text not null default 'pendente'
    check (status in ('pendente', 'em_analise', 'convertido', 'recusado')),
  demanda_gerada_id uuid references demands (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clients (id) on delete cascade,
  autor_id uuid references users (id) on delete set null,
  mensagem text not null,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clients (id) on delete cascade,
  mes_referencia date not null,
  pdf_url text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security (RLS)
-- Garante que cada cliente só veja os próprios dados.
-- Admin/equipe veem tudo.
-- ============================================================

alter table clients enable row level security;
alter table briefings enable row level security;
alter table plans enable row level security;
alter table users enable row level security;
alter table demands enable row level security;
alter table tags enable row level security;
alter table demand_tags enable row level security;
alter table attachments enable row level security;
alter table comments enable row level security;
alter table approvals enable row level security;
alter table client_requests enable row level security;
alter table chat_messages enable row level security;
alter table reports enable row level security;

-- Função auxiliar: retorna o papel e o cliente_id do usuário autenticado
create or replace function auth_user_role() returns text
language sql security definer stable as $$
  select papel from users where id = auth.uid()
$$;

create or replace function auth_user_cliente_id() returns uuid
language sql security definer stable as $$
  select cliente_id from users where id = auth.uid()
$$;

-- users: cada usuário vê o próprio registro; admin/equipe veem todos
create policy "users_select" on users for select
  using (id = auth.uid() or auth_user_role() in ('admin', 'equipe'));

-- clients: admin/equipe veem todos; cliente vê apenas o seu
create policy "clients_select" on clients for select
  using (auth_user_role() in ('admin', 'equipe') or id = auth_user_cliente_id());

create policy "clients_modify" on clients for all
  using (auth_user_role() in ('admin', 'equipe'));

-- briefings / plans: mesma regra de clients
create policy "briefings_select" on briefings for select
  using (auth_user_role() in ('admin', 'equipe') or cliente_id = auth_user_cliente_id());
create policy "briefings_modify" on briefings for all
  using (auth_user_role() in ('admin', 'equipe'));

create policy "plans_select" on plans for select
  using (auth_user_role() in ('admin', 'equipe') or cliente_id = auth_user_cliente_id());
create policy "plans_modify" on plans for all
  using (auth_user_role() in ('admin', 'equipe'));

-- demands: admin/equipe acesso total; cliente vê apenas as suas (somente leitura)
create policy "demands_select" on demands for select
  using (auth_user_role() in ('admin', 'equipe') or cliente_id = auth_user_cliente_id());
create policy "demands_modify" on demands for all
  using (auth_user_role() in ('admin', 'equipe'));

-- tags / demand_tags: leitura geral, escrita só admin/equipe
create policy "tags_select" on tags for select using (true);
create policy "tags_modify" on tags for all
  using (auth_user_role() in ('admin', 'equipe'));

create policy "demand_tags_select" on demand_tags for select using (true);
create policy "demand_tags_modify" on demand_tags for all
  using (auth_user_role() in ('admin', 'equipe'));

-- attachments / comments: cliente vê o que está ligado às suas demandas
create policy "attachments_select" on attachments for select
  using (
    auth_user_role() in ('admin', 'equipe')
    or demand_id in (select id from demands where cliente_id = auth_user_cliente_id())
  );
create policy "attachments_modify" on attachments for all
  using (auth_user_role() in ('admin', 'equipe'));

create policy "comments_select" on comments for select
  using (
    auth_user_role() in ('admin', 'equipe')
    or (
      interno = false
      and demand_id in (select id from demands where cliente_id = auth_user_cliente_id())
    )
  );
-- comments: admin/equipe podem criar/editar/excluir qualquer comentário;
-- cliente pode criar comentários externos (interno = false) nas próprias demandas
create policy "comments_insert" on comments for insert
  with check (
    auth_user_role() in ('admin', 'equipe')
    or (
      interno = false
      and demand_id in (select id from demands where cliente_id = auth_user_cliente_id())
    )
  );
create policy "comments_update_admin" on comments for update
  using (auth_user_role() in ('admin', 'equipe'));
create policy "comments_delete_admin" on comments for delete
  using (auth_user_role() in ('admin', 'equipe'));

-- approvals: cliente pode ver e atualizar (aprovar/pedir revisão) das suas demandas
create policy "approvals_select" on approvals for select
  using (
    auth_user_role() in ('admin', 'equipe')
    or demand_id in (select id from demands where cliente_id = auth_user_cliente_id())
  );
create policy "approvals_update_admin" on approvals for all
  using (auth_user_role() in ('admin', 'equipe'));
create policy "approvals_update_client" on approvals for update
  using (demand_id in (select id from demands where cliente_id = auth_user_cliente_id()));

-- client_requests: cliente cria e vê as próprias; admin/equipe veem e gerenciam todas
create policy "client_requests_select" on client_requests for select
  using (auth_user_role() in ('admin', 'equipe') or cliente_id = auth_user_cliente_id());
create policy "client_requests_insert_client" on client_requests for insert
  with check (cliente_id = auth_user_cliente_id());
create policy "client_requests_modify_admin" on client_requests for update
  using (auth_user_role() in ('admin', 'equipe'));

-- chat_messages: cliente e agência trocam mensagens sobre o cliente
create policy "chat_select" on chat_messages for select
  using (auth_user_role() in ('admin', 'equipe') or cliente_id = auth_user_cliente_id());
create policy "chat_insert" on chat_messages for insert
  with check (auth_user_role() in ('admin', 'equipe') or cliente_id = auth_user_cliente_id());

-- reports: cliente vê os próprios; admin/equipe gerenciam
create policy "reports_select" on reports for select
  using (auth_user_role() in ('admin', 'equipe') or cliente_id = auth_user_cliente_id());
create policy "reports_modify" on reports for all
  using (auth_user_role() in ('admin', 'equipe'));

-- ============================================================
-- Storage: bucket de anexos das demandas
-- Execute no SQL Editor do Supabase (ou crie pela UI: Storage > New bucket
-- "attachments", marcado como "Public bucket").
-- ============================================================

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

-- Leitura pública dos arquivos (necessário para getPublicUrl funcionar)
create policy "attachments_bucket_read" on storage.objects for select
  using (bucket_id = 'attachments');

-- Upload: usuários autenticados podem enviar arquivos
create policy "attachments_bucket_insert" on storage.objects for insert
  with check (bucket_id = 'attachments' and auth.role() = 'authenticated');

-- Exclusão: apenas admin/equipe
create policy "attachments_bucket_delete" on storage.objects for delete
  using (bucket_id = 'attachments' and auth_user_role() in ('admin', 'equipe'));
