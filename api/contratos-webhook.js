// Função serverless (Vercel) — webhook do Autentique.
// Recebe eventos de assinatura, valida o HMAC e atualiza o contrato no Supabase.

import crypto from 'crypto'

// Precisamos do corpo bruto (rawBody) para validar a assinatura HMAC.
export const config = { api: { bodyParser: false } }

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

async function sbUpdateByAutentiqueId(autentiqueId, patch) {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const r = await fetch(
    `${url}/rest/v1/contratos?autentique_id=eq.${encodeURIComponent(autentiqueId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(patch),
    }
  )
  if (!r.ok) {
    const t = await r.text()
    throw new Error(t || 'Falha ao atualizar contrato')
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const rawBody = await readRawBody(req)

    // Validação de autenticidade (HMAC-SHA256)
    const secret = process.env.AUTENTIQUE_WEBHOOK_SECRET
    if (secret) {
      const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
      const received = req.headers['x-autentique-signature'] || ''
      const ok =
        received.length === expected.length &&
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received))
      if (!ok) return res.status(401).json({ error: 'Assinatura inválida' })
    }

    const payload = JSON.parse(rawBody || '{}')
    const type = payload?.event?.type || ''
    const object = payload?.event?.data?.object || {}

    // Resolve o id do documento conforme o tipo de evento
    const docId = type.startsWith('document')
      ? object.id
      : object?.document?.id || object?.document_id

    if (docId && (type === 'document.finished' || type === 'signature.accepted')) {
      const signedUrl = object?.files?.signed || object?.document?.files?.signed || null
      await sbUpdateByAutentiqueId(docId, {
        status: 'assinado',
        signed_at: new Date().toISOString(),
        ...(signedUrl ? { arquivo_url: signedUrl } : {}),
      })
    } else if (docId && type === 'signature.rejected') {
      await sbUpdateByAutentiqueId(docId, { status: 'recusado' })
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erro inesperado' })
  }
}
