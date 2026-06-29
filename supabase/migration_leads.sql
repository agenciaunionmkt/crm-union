-- ============================================================
-- Pipeline de CRM — Leads / Funil de vendas
-- ============================================================

create table if not exists leads (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  empresa         text,
  whatsapp        text,
  email           text,
  origem          text not null default 'outro',
  quem_indicou    text,
  servico_interesse text,
  tipo_cliente    text not null default 'avulso',
  observacoes     text,
  etapa           text not null default 'lead',
  status_qualificacao text default 'aguardando_resposta',
  -- dados específicos por etapa (jsonb)
  dados_diagnostico  jsonb default '{}',
  dados_reuniao      jsonb default '{}',
  dados_proposta     jsonb default '{}',
  dados_conversao    jsonb default '{}',
  dados_em_andamento jsonb default '{}',
  dados_pos_venda    jsonb default '{}',
  criado_por      uuid references users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists leads_etapa_idx on leads (etapa);
create index if not exists leads_created_idx on leads (created_at desc);

-- Atualiza updated_at automaticamente
create or replace function touch_leads_updated_at()
  returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists leads_updated_at on leads;
create trigger leads_updated_at before update on leads
  for each row execute function touch_leads_updated_at();

-- RLS: apenas equipe acessa
alter table leads enable row level security;
drop policy if exists leads_staff on leads;
create policy leads_staff on leads for all to authenticated
  using (is_staff()) with check (is_staff());

notify pgrst, 'reload schema';
