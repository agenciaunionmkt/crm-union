-- ============================================================
-- Migração: campos adicionais da tabela clients
-- Resolve o erro "Could not find the 'instagram_senha' column of 'clients'"
-- Rode no Supabase: Project > SQL Editor > New query > cole > Run
-- Idempotente: pode rodar mais de uma vez sem erro.
-- ============================================================

alter table clients add column if not exists tipo_cliente text not null default 'avulso'
  check (tipo_cliente in ('avulso', 'recorrente'));
alter table clients add column if not exists valor_servico numeric(10, 2);
alter table clients add column if not exists instagram_usuario text;
alter table clients add column if not exists instagram_senha text;

-- Atualiza o cache de schema do PostgREST imediatamente
notify pgrst, 'reload schema';
