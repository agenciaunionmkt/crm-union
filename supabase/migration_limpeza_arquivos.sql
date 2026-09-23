-- ============================================================
-- Migração: limpeza automática de arquivos com mais de N dias
-- Usada pelo cron api/limpar-arquivos.js. Mantém a aba Materiais.
-- Rode no Supabase: SQL Editor > New query > cole > Run
-- Idempotente.
-- ============================================================

create or replace function public.limpar_arquivos_vencidos(dias int default 30)
returns table (bucket text, caminho text)
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  corte timestamptz := now() - make_interval(days => dias);
begin
  delete from public.attachments where created_at < corte;
  update public.chat_messages set arquivo_url = null, nome_arquivo = null
    where created_at < corte and arquivo_url is not null;
  update public.client_requests set arquivo_url = null, nome_arquivo = null
    where created_at < corte and arquivo_url is not null;

  return query
    select o.bucket_id::text, o.name::text
    from storage.objects o
    where o.bucket_id in ('anexos', 'attachments')
      and o.name not like 'materiais/%'
      and o.created_at < corte;
end;
$$;

-- só o servidor (service role) pode chamar
revoke all on function public.limpar_arquivos_vencidos(int) from public, anon, authenticated;
grant execute on function public.limpar_arquivos_vencidos(int) to service_role;

notify pgrst, 'reload schema';
