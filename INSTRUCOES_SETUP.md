# 📋 Instruções de Setup - CRM Union

## ✅ O Que Foi Criado

### 1. Módulo Financeiro (Entradas/Saídas)
- ✅ Página completa de Financeiro em `/admin/financeiro`
- ✅ Funcionalidades:
  - Adicionar entradas e saídas
  - Filtrar por tipo (entrada/saída) e status (pendente/pago/vencido)
  - Resumo visual com saldo total
  - Editar e deletar transações
  - Campos: Nome, Valor, Tipo, Forma de Pagamento, Vencimento, Status, Categoria, Notas

### 2. Arquivos Criados
```
src/lib/api/financial.js          → API de financeiro
src/components/FinancialForm.jsx  → Formulário de transações
src/pages/admin/Financeiro.jsx    → Página principal
src/App.jsx                       → Atualizado com rota /admin/financeiro
src/layouts/AdminLayout.jsx       → Atualizado com menu Financeiro
SUPABASE_SETUP.sql               → Script SQL para criar tabelas
```

---

## 🔧 PASSO A PASSO - CONFIGURAR NO SUPABASE

### PASSO 1️⃣: Criar Conta do Sócio

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto "CRM Union"
3. Vá para **Authentication > Users**
4. Clique em **"Add user"**
5. Preencha:
   - **Email:** `alemoutinho.union@gmail.com`
   - **Password:** `Superale`
   - Marque **"Auto generate password"** se preferir (gere uma senha forte depois)
6. Clique **"Create user"**
7. **Copie o UUID** do usuário criado (você vai precisar)

### PASSO 2️⃣: Criar Tabelas no Supabase

1. Ainda no Supabase, vá para **SQL Editor**
2. Clique em **"New Query"**
3. Abra o arquivo `SUPABASE_SETUP.sql` deste projeto
4. **Copie TODO o conteúdo** do arquivo
5. **Cole no SQL Editor** do Supabase
6. Clique em **"Run"** para executar
7. ✅ As tabelas `financial_entries` e `client_users` foram criadas!

### PASSO 3️⃣: Registrar o Sócio na Tabela Users

1. No SQL Editor, clique em **"New Query"** novamente
2. Cole este comando (substitua `UUID_AQUI` pelo UUID copiado no PASSO 1):

```sql
INSERT INTO public.users (id, nome, email, papel)
VALUES (
  'UUID_AQUI',
  'Ale Moutinho',
  'alemoutinho.union@gmail.com',
  'admin'
);
```

3. Clique em **"Run"**
4. ✅ O sócio foi criado como admin!

---

## 🎯 USANDO O MÓDULO FINANCEIRO

### Acessar
1. Faça login em http://localhost:5173 (ou seu domínio)
2. Use a conta: `jralmeida.union@gmail.com` / sua senha
3. No menu esquerdo, clique em **"Financeiro"**

### Adicionar uma Transação
1. Clique no botão **"+ Nova Transação"**
2. Preencha o formulário:
   - **Tipo:** Entrada ou Saída
   - **Nome:** Descrição (ex: "Venda de Projeto")
   - **Valor:** Valor em R$
   - **Vencimento:** Data
   - **Status:** Pendente, Pago ou Vencido
   - **Forma de Pagamento:** PIX, Cartão, Transferência, etc
   - **Categoria:** Operacional, Pessoal, etc (opcional)
   - **Notas:** Observações (opcional)
3. Clique em **"Salvar"**

### Ver Resumo
- **Saldo:** Total de entradas - total de saídas
- **Entradas:** Soma de todas as entradas
- **Saídas:** Soma de todas as saídas
- **Pendentes:** Total de transações pendentes

### Filtros
- Busque por nome da transação
- Filtre por Tipo (entrada/saída)
- Filtre por Status (pendente/pago/vencido)

---

## 📝 PRÓXIMOS PASSOS

### ❌ Remover Página de Cadastro Pública
A página `/cadastro` deveria ser removida ou protegida, pois apenas 2 admins devem existir:
- Você: `jralmeida.union@gmail.com`
- Sócio: `alemoutinho.union@gmail.com`

**Solução:** Remover a rota `/cadastro` do App.jsx ou adicionar verificação de admin

### ⏳ Criar Acesso de Clientes (Opção 3)
Admin cria conta para cliente manualmente (não implementado ainda):
1. Painel de Clientes → "+ Novo Cliente"
2. Adicionar campos: Email e Senha de acesso
3. Sistema cria usuário automaticamente na tabela `client_users`

### 🎨 UI/UX - Light/Dark Mode
Quando tiver referências visuais, implementaremos:
- Toggle Light/Dark/System mode
- Melhorias de design
- Layout responsivo

---

## 🆘 TROUBLESHOOTING

### Erro: "Table financial_entries not found"
- Verifique se executou o SQL corretamente
- Vá para **Supabase > SQL Editor > New Query** e execute novamente

### Erro: "Permission denied on financial_entries"
- As políticas de RLS podem estar bloqueando
- Verifique se você está logado como admin

### O Módulo não aparece no menu
- Verifique se atualizou o arquivo `AdminLayout.jsx`
- Faça reload do navegador (Ctrl+F5)

---

## 📞 Suporte

Qualquer dúvida sobre a configuração, entre em contato!

**Data:** 2026-06-10
**Versão:** 1.0
