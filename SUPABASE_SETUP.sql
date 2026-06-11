-- ============================================
-- SETUP DO SUPABASE PARA CRM UNION
-- Copie e cole o conteúdo deste arquivo no SQL Editor do Supabase
-- ============================================

-- 1. Criar tabela financial_entries (Entradas/Saídas Financeiras)
CREATE TABLE IF NOT EXISTS public.financial_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  tipo VARCHAR NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  forma_pagamento VARCHAR DEFAULT 'pix',
  vencimento DATE NOT NULL,
  status VARCHAR DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido')),
  categoria VARCHAR,
  notas TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar RLS para financial_entries
ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_admin_financial"
ON public.financial_entries
FOR ALL
USING (
  auth.jwt() ->> 'role' = 'admin' OR
  (SELECT papel FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- 2. Criar tabela client_users (Credenciais de Acesso dos Clientes)
CREATE TABLE IF NOT EXISTS public.client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar RLS para client_users
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_admin_client_users"
ON public.client_users
FOR ALL
USING (
  (SELECT papel FROM public.users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "allow_client_view_own"
ON public.client_users
FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM public.users WHERE role = 'cliente')
);

-- 3. Atualizar tabela users para incluir sócio
-- (Apenas se necessário - verifique se a tabela existe)
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS socio BOOLEAN DEFAULT false;

-- ============================================
-- INSTRUÇÕES MANUAIS PARA CRIAR O SÓCIO
-- ============================================

-- 1. No painel Supabase:
--    Authentication > Users > Add User
--    Email: alemoutinho.union@gmail.com
--    Password: Superale
--    Anote o UUID gerado (será necessário no próximo passo)

-- 2. Copie o UUID e execute este comando (substitua UUID_DO_SOCIO):
-- INSERT INTO public.users (id, nome, email, papel)
-- VALUES (
--   'UUID_DO_SOCIO_AQUI',
--   'Ale Moutinho',
--   'alemoutinho.union@gmail.com',
--   'admin'
-- );

-- ============================================
-- EXEMPLOS DE INSERÇÃO (PARA TESTE)
-- ============================================

-- Exemplo: Inserir uma entrada
-- INSERT INTO public.financial_entries (nome, valor, tipo, forma_pagamento, vencimento, status, categoria, notas)
-- VALUES ('Venda de Projeto', 5000.00, 'entrada', 'pix', '2026-06-15', 'pago', 'Projetos', 'Projeto X finalizado');

-- Exemplo: Inserir uma saída
-- INSERT INTO public.financial_entries (nome, valor, tipo, forma_pagamento, vencimento, status, categoria)
-- VALUES ('Aluguel do Escritório', 3000.00, 'saida', 'transferencia', '2026-06-10', 'pago', 'Operacional');

-- ============================================
-- FIM DO SETUP
-- ============================================
