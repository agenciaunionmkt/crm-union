// Função serverless (Vercel) — integração com o Asaas.
// Cria/garante o cliente no Asaas, gera cobrança avulsa e assinatura mensal.
// Cada cobrança vira um lançamento no Financeiro (status pendente) com link de pagamento.

const ASAAS_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3'

// Multa e juros por atraso, conforme contrato (2% de multa + 1% ao mês de juros).
const MULTA = { value: 2, type: 'PERCENTAGE' }
const JUROS = { value: 1 }

async function asaas(path, method, body, key) {
  const r = await fetch(`${ASAAS_URL}${path}`, {
    method,
    headers: { access_token: key, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    const msg = data?.errors?.[0]?.description || data?.message || 'Erro na API do Asaas'
    throw new Error(msg)
  }
  return data
}

// ---- Supabase REST helpers ----
function sbHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
}
const SB = () => process.env.VITE_SUPABASE_URL

async function sbGetClient(id) {
  const r = await fetch(`${SB()}/rest/v1/clients?id=eq.${id}&select=*`, { headers: sbHeaders() })
  const d = await r.json()
  return Array.isArray(d) ? d[0] : null
}
async function sbUpdateClient(id, patch) {
  await fetch(`${SB()}/rest/v1/clients?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...sbHeaders(), Prefer: 'return=minimal' },
    body: JSON.stringify(patch),
  })
}
async function sbInsertEntry(row) {
  const r = await fetch(`${SB()}/rest/v1/financial_entries`, {
    method: 'POST',
    headers: { ...sbHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify(row),
  })
  const d = await r.json()
  if (!r.ok) throw new Error(d?.message || 'Falha ao registrar lançamento')
  return Array.isArray(d) ? d[0] : d
}

const soDigitos = (v) => (v || '').replace(/\D/g, '')

// Garante o customer no Asaas para o cliente; salva o id no banco.
async function ensureCustomer(key, cliente) {
  if (cliente.asaas_customer_id) return cliente.asaas_customer_id
  const cpfCnpj = soDigitos(cliente.cnpj)
  if (!cpfCnpj) throw new Error('Cadastre o CNPJ do cliente antes de gerar cobrança')
  const customer = await asaas('/customers', 'POST', {
    name: cliente.nome,
    cpfCnpj,
    email: cliente.contato_email || undefined,
    mobilePhone: soDigitos(cliente.contato_telefone) || undefined,
    notificationDisabled: false,
  }, key)
  await sbUpdateClient(cliente.id, { asaas_customer_id: customer.id })
  return customer.id
}

function proximoVencimento(dia) {
  const d = parseInt(dia, 10)
  const hoje = new Date()
  if (!d) return hoje.toISOString().split('T')[0]
  let ano = hoje.getFullYear()
  let mes = hoje.getMonth()
  if (d < hoje.getDate()) mes += 1
  const ultimo = new Date(ano, mes + 1, 0).getDate()
  return new Date(ano, mes, Math.min(d, ultimo)).toISOString().split('T')[0]
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const key = process.env.ASAAS_API_KEY
  if (!key) return res.status(500).json({ error: 'Asaas não configurado (defina ASAAS_API_KEY no Vercel)' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const { action, clienteId } = body
    const cliente = clienteId ? await sbGetClient(clienteId) : null
    if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado' })

    // Cobrança avulsa (PIX + boleto): gera pagamento e registra lançamento
    if (action === 'cobranca') {
      const customerId = await ensureCustomer(key, cliente)
      const valor = Number(body.valor)
      const vencimento = body.vencimento || proximoVencimento(cliente.dia_vencimento)
      const descricao = body.descricao || `Serviços - ${cliente.nome}`
      const pay = await asaas('/payments', 'POST', {
        customer: customerId,
        billingType: 'BOLETO',
        value: valor,
        dueDate: vencimento,
        description: descricao,
        fine: MULTA,
        interest: JUROS,
      }, key)

      const entry = await sbInsertEntry({
        nome: descricao,
        valor,
        tipo: 'entrada',
        forma_pagamento: 'boleto',
        vencimento,
        status: 'pendente',
        recorrente: false,
        cliente_id: cliente.id,
        asaas_payment_id: pay.id,
        link_pagamento: pay.invoiceUrl,
      })
      return res.status(200).json({ entry, link: pay.invoiceUrl })
    }

    // Assinatura mensal recorrente
    if (action === 'assinatura') {
      if (cliente.asaas_subscription_id) {
        return res.status(200).json({ subscriptionId: cliente.asaas_subscription_id, jaExiste: true })
      }
      const customerId = await ensureCustomer(key, cliente)
      const valor = Number(body.valor || cliente.valor_servico)
      if (!valor) throw new Error('Defina o valor do serviço do cliente')
      const sub = await asaas('/subscriptions', 'POST', {
        customer: customerId,
        billingType: 'BOLETO',
        value: valor,
        nextDueDate: proximoVencimento(cliente.dia_vencimento),
        cycle: 'MONTHLY',
        description: `Mensalidade - ${cliente.nome}`,
        fine: MULTA,
        interest: JUROS,
      }, key)
      await sbUpdateClient(cliente.id, { asaas_subscription_id: sub.id })
      return res.status(200).json({ subscriptionId: sub.id })
    }

    return res.status(400).json({ error: 'Ação inválida' })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erro inesperado' })
  }
}
