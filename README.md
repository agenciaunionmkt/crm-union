# CRM da Agência

Aplicação interna para gestão de clientes e demandas, com portal próprio para os clientes acompanharem o cronograma do mês, aprovarem entregas e abrirem solicitações.

## Stack

- React + Vite
- Tailwind CSS
- React Router
- Supabase (autenticação + banco de dados Postgres)

## Como rodar localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie um projeto gratuito em [supabase.com](https://supabase.com).

3. No SQL Editor do Supabase, execute o script `supabase/schema.sql` — ele cria todas as tabelas e as regras de segurança (RLS).

4. Crie seu usuário admin:
   - Em **Authentication > Users**, clique em **Add user** e crie seu usuário (e-mail/senha).
   - Copie o UUID gerado e siga as instruções em `supabase/primeiro_admin.sql` para vincular esse usuário como `admin` na tabela `users`.

5. Copie `.env.example` para `.env` e preencha com a URL e a chave anônima do seu projeto Supabase (em **Project Settings > API**):

   ```bash
   cp .env.example .env
   ```

6. Rode o projeto:

   ```bash
   npm run dev
   ```

7. Acesse `http://localhost:5173/login` e entre com o usuário admin criado.

## Perfis de acesso

- **admin / equipe**: acessam `/admin` — gestão de clientes, demandas, solicitações e relatórios.
- **cliente**: acessa `/portal` — cronograma do mês, status das demandas, aprovações, solicitações e histórico.

## Deploy

O projeto pode ser publicado gratuitamente na [Vercel](https://vercel.com), conectando o repositório do GitHub e configurando as mesmas variáveis de ambiente (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) em **Project Settings > Environment Variables**.
