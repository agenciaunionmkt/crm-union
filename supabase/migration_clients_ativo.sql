-- Clientes inativos / ex-clientes
alter table clients add column if not exists ativo boolean not null default true;
alter table clients add column if not exists motivo_saida text;
alter table clients add column if not exists data_saida date;

create index if not exists clients_ativo_idx on clients (ativo);

notify pgrst, 'reload schema';
