-- ============================================================
-- Migração: contratos (assinatura via Autentique)
-- Rode no Supabase: SQL Editor > New query > cole > Run
-- ============================================================

create table if not exists contratos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clients (id) on delete cascade,
  titulo text not null,
  autentique_id text unique,
  status text not null default 'enviado'
    check (status in ('enviado', 'assinado', 'recusado')),
  signatario_email text,
  link_assinatura text,
  arquivo_url text,
  created_by uuid references users (id) on delete set null,
  created_at timestamptz not null default now(),
  signed_at timestamptz
);

create index if not exists contratos_cliente_idx on contratos (cliente_id, created_at desc);
create index if not exists contratos_autentique_idx on contratos (autentique_id);

notify pgrst, 'reload schema';
