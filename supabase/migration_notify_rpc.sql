-- ============================================================
-- Migração: funções de notificação (SECURITY DEFINER)
-- Permite criar notificações para a equipe / para o cliente mesmo com RLS ligado
-- (um cliente não pode inserir notificação para outro usuário diretamente).
-- Rode no Supabase: SQL Editor > New query > cole > Run
-- ============================================================

create or replace function public.notify_team(p_titulo text, p_mensagem text, p_link text)
  returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, titulo, mensagem, link)
  select id, p_titulo, p_mensagem, p_link
  from public.users
  where papel in ('admin', 'equipe');
end $$;

create or replace function public.notify_client(p_cliente_id uuid, p_titulo text, p_mensagem text, p_link text)
  returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, titulo, mensagem, link)
  select id, p_titulo, p_mensagem, p_link
  from public.users
  where cliente_id = p_cliente_id and papel = 'cliente';
end $$;

grant execute on function public.notify_team(text, text, text) to authenticated;
grant execute on function public.notify_client(uuid, text, text, text) to authenticated;

notify pgrst, 'reload schema';
