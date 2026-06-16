// Função serverless (Vercel) — cria um contrato para assinatura no Autentique
// (GraphQL multipart upload) e registra na tabela `contratos` do Supabase.

const AUTENTIQUE_URL = 'https://api.autentique.com.br/v2/graphql'

const CREATE_DOC = `
  mutation($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
    createDocument(document: $document, signers: $signers, file: $file) {
      id
      name
      signatures { public_id email link { short_link } }
    }
  }
`

async function sbInsert(row) {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const r = await fetch(`${url}/rest/v1/contratos`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(row),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data?.message || 'Falha ao salvar contrato no banco')
  return Array.isArray(data) ? data[0] : data
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const key = process.env.AUTENTIQUE_API_KEY
  if (!key) {
    return res.status(500).json({ error: 'Assinatura não configurada (defina AUTENTIQUE_API_KEY no Vercel)' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const { clienteId, titulo, signerEmail, fileBase64, fileName, createdBy } = body

    if (!clienteId || !titulo || !signerEmail || !fileBase64) {
      return res.status(400).json({ error: 'Informe cliente, título, e-mail do signatário e arquivo' })
    }

    const buffer = Buffer.from(fileBase64.split(',').pop(), 'base64')

    const operations = JSON.stringify({
      query: CREATE_DOC,
      variables: {
        document: { name: titulo },
        signers: [{ email: signerEmail, action: 'SIGN' }],
        file: null,
      },
    })

    const form = new FormData()
    form.append('operations', operations)
    form.append('map', JSON.stringify({ 0: ['variables.file'] }))
    form.append('0', new Blob([buffer], { type: 'application/pdf' }), fileName || 'contrato.pdf')

    const r = await fetch(AUTENTIQUE_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    })
    const data = await r.json()

    if (!r.ok || data.errors) {
      const msg = data?.errors?.[0]?.message || 'Erro ao criar documento no Autentique'
      return res.status(502).json({ error: msg })
    }

    const doc = data.data.createDocument
    const signature = (doc.signatures || []).find((s) => s.email === signerEmail) || doc.signatures?.[0]
    const link = signature?.link?.short_link || null

    const contrato = await sbInsert({
      cliente_id: clienteId,
      titulo,
      autentique_id: doc.id,
      status: 'enviado',
      signatario_email: signerEmail,
      link_assinatura: link,
      created_by: createdBy || null,
    })

    return res.status(200).json({ contrato, link })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erro inesperado' })
  }
}
