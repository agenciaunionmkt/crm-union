-- ============================================================
-- Anotações / fichas técnicas por cliente
-- Rode no Supabase: SQL Editor > New query > cole > Run
-- ============================================================

create table if not exists client_notes (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references clients (id) on delete cascade,
  titulo      text not null,
  conteudo    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists client_notes_cliente_idx on client_notes (cliente_id);

create or replace function touch_client_notes_updated_at()
  returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists client_notes_updated_at on client_notes;
create trigger client_notes_updated_at before update on client_notes
  for each row execute function touch_client_notes_updated_at();

-- RLS: apenas equipe acessa
alter table client_notes enable row level security;
drop policy if exists client_notes_staff on client_notes;
create policy client_notes_staff on client_notes for all to authenticated
  using (is_staff()) with check (is_staff());

notify pgrst, 'reload schema';
