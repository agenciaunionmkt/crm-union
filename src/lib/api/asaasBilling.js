// Chamadas à função serverless do Asaas (criação de cobrança e assinatura).

async function postAsaas(payload) {
  const res = await fetch('/api/asaas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Falha na operação com o Asaas')
  return data
}

export function createCharge(clienteId, { valor, vencimento, descricao }) {
  return postAsaas({ action: 'cobranca', clienteId, valor, vencimento, descricao })
}

export function createSubscription(clienteId, valor) {
  return postAsaas({ action: 'assinatura', clienteId, valor })
}
