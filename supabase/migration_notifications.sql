-- ============================================================
-- Migração: tabela de notificações
-- Rode no Supabase: SQL Editor > New query > cole > Run
-- ============================================================

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  titulo text not null,
  mensagem text,
  link text,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on notifications (user_id, created_at desc);

notify pgrst, 'reload schema';
