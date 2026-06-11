-- ============================================================
-- Criar o primeiro usuário admin
-- ============================================================
-- 1. No painel do Supabase, vá em Authentication > Users > Add user
--    e crie um usuário com seu e-mail e uma senha.
-- 2. Copie o UUID gerado para esse usuário (coluna "User UID").
-- 3. Substitua os valores abaixo e execute este script no SQL Editor.

insert into users (id, nome, email, papel)
values (
  '70531077-81e4-48fd-a968-d67f9bd05856',
  'Junior Almeida',
  'jralmeida.union@gmail.com',
  'admin'
);
