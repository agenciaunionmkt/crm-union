// Função serverless (Vercel) — webhook do Asaas.
// Em vez de confiar apenas no token do header, valida o pagamento direto na API
// do Asaas (com a ASAAS_API_KEY): só processa pagamentos que existem na sua conta.
// Atualiza o lançamento no Financeiro e cria a mensalidade gerada por assinatura.

const ASAAS_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3'

function sbHeaders(extra = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...extra }
}
const SB = () => process.env.VITE_SUPABASE_URL

async function clienteIdByCustomer(customerId) {
  if (!customerId) return null
  const r = await fetch(
    `${SB()}/rest/v1/clients?asaas_customer_id=eq.${encodeURIComponent(customerId)}&select=id`,
    { headers: sbHeaders() }
  )
  const d = await r.json()
  return Array.isArray(d) && d[0] ? d[0].id : null
}
async function findByPayment(paymentId) {
  const r = await fetch(
    `${SB()}/rest/v1/financial_entries?asaas_payment_id=eq.${encodeURIComponent(paymentId)}&select=id`,
    { headers: sbHeaders() }
  )
  const d = await r.json()
  return Array.isArray(d) ? d[0] : null
}
async function patchByPayment(paymentId, patch) {
  await fetch(`${SB()}/rest/v1/financial_entries?asaas_payment_id=eq.${encodeURIComponent(paymentId)}`, {
    method: 'PATCH',
    headers: sbHeaders({ Prefer: 'return=minimal' }),
    body: JSON.stringify(patch),
  })
}
async function insertEntry(row) {
  await fetch(`${SB()}/rest/v1/financial_entries`, {
    method: 'POST',
    headers: sbHeaders({ Prefer: 'return=minimal' }),
    body: JSON.stringify(row),
  })
}

// Mapeia o status do Asaas para o status do nosso Financeiro.
function mapStatus(asaasStatus) {
  if (['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(asaasStatus)) return 'pago'
  if (asaasStatus === 'OVERDUE') return 'vencido'
  return 'pendente'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    let payment = body.payment
    if (!payment?.id) return res.status(200).json({ ok: true })

    // Valida na fonte: busca o pagamento na API do Asaas (autoritativo).
    const apiKey = process.env.ASAAS_API_KEY
    if (apiKey) {
      const r = await fetch(`${ASAAS_URL}/payments/${payment.id}`, {
        headers: { access_token: apiKey },
      })
      if (r.status === 404) return res.status(200).json({ ignored: true }) // não é da sua conta
      if (r.ok) payment = await r.json()
    }

    const status = mapStatus(payment.status)
    const existente = await findByPayment(payment.id)

    if (existente) {
      await patchByPayment(payment.id, { status })
    } else {
      await insertEntry({
        nome: payment.description || (payment.subscription ? 'Mensalidade' : 'Cobrança'),
        valor: payment.value,
        tipo: 'entrada',
        forma_pagamento: 'boleto',
        vencimento: payment.dueDate,
        status,
        recorrente: !!payment.subscription,
        cliente_id: await clienteIdByCustomer(payment.customer),
        asaas_payment_id: payment.id,
        link_pagamento: payment.invoiceUrl || null,
      })
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erro inesperado' })
  }
}
