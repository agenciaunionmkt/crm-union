// Função serverless (Vercel) — webhook do Asaas.
// Atualiza o lançamento no Financeiro conforme o pagamento (pago/vencido) e
// cria automaticamente o lançamento das mensalidades geradas por assinatura.

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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  // Autenticação do webhook (token configurado no painel do Asaas)
  const token = process.env.ASAAS_WEBHOOK_TOKEN
  if (token && req.headers['asaas-access-token'] !== token) {
    return res.status(401).json({ error: 'Token inválido' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const event = body.event
    const payment = body.payment
    if (!payment?.id) return res.status(200).json({ ok: true })

    const pago = ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED_IN_CASH'].includes(event)
    const existente = await findByPayment(payment.id)

    if (event === 'PAYMENT_CREATED' && !existente) {
      // Mensalidade gerada por assinatura: cria o lançamento pendente
      await insertEntry({
        nome: payment.description || 'Mensalidade',
        valor: payment.value,
        tipo: 'entrada',
        forma_pagamento: 'boleto',
        vencimento: payment.dueDate,
        status: 'pendente',
        recorrente: !!payment.subscription,
        cliente_id: await clienteIdByCustomer(payment.customer),
        asaas_payment_id: payment.id,
        link_pagamento: payment.invoiceUrl || null,
      })
    } else if (pago) {
      if (existente) {
        await patchByPayment(payment.id, { status: 'pago' })
      } else {
        // Pagamento sem lançamento prévio: registra já como pago
        await insertEntry({
          nome: payment.description || 'Recebimento',
          valor: payment.value,
          tipo: 'entrada',
          forma_pagamento: 'boleto',
          vencimento: payment.dueDate,
          status: 'pago',
          recorrente: !!payment.subscription,
          cliente_id: await clienteIdByCustomer(payment.customer),
          asaas_payment_id: payment.id,
          link_pagamento: payment.invoiceUrl || null,
        })
      }
    } else if (event === 'PAYMENT_OVERDUE' && existente) {
      await patchByPayment(payment.id, { status: 'vencido' })
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erro inesperado' })
  }
}
