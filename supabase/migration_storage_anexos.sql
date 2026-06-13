-- ============================================================
-- Migração: bucket de Storage para anexos de demandas (item 7)
-- Rode no Supabase: Project > SQL Editor > New query > cole > Run
-- ============================================================

-- Bucket público (URLs com caminho aleatório/UUID, não enumeráveis)
insert into storage.buckets (id, name, public)
values ('anexos', 'anexos', true)
on conflict (id) do nothing;

-- Políticas de acesso ao bucket
drop policy if exists "anexos_leitura_publica" on storage.objects;
drop policy if exists "anexos_insert_autenticado" on storage.objects;
drop policy if exists "anexos_update_autenticado" on storage.objects;
drop policy if exists "anexos_delete_autenticado" on storage.objects;

create policy "anexos_leitura_publica" on storage.objects
  for select using (bucket_id = 'anexos');

create policy "anexos_insert_autenticado" on storage.objects
  for insert to authenticated with check (bucket_id = 'anexos');

create policy "anexos_update_autenticado" on storage.objects
  for update to authenticated using (bucket_id = 'anexos');

create policy "anexos_delete_autenticado" on storage.objects
  for delete to authenticated using (bucket_id = 'anexos');
