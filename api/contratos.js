// Função serverless (Vercel) — cria um contrato para assinatura no Autentique
// (GraphQL multipart upload) e registra na tabela `contratos` do Supabase.

const AUTENTIQUE_URL = 'https://api.autentique.com.br/v2/graphql'

const CREATE_DOC = `
  mutation($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!, $sandbox: Boolean) {
    createDocument(document: $document, signers: $signers, file: $file, sandbox: $sandbox) {
      id
      name
      signatures { public_id email link { short_link } }
    }
  }
`

const CREATE_LINK = `
  mutation($public_id: UUID!) {
    createLinkToSignature(public_id: $public_id) { short_link }
  }
`

const GET_DOC = `
  query($id: UUID!) {
    document(id: $id) {
      id
      files { signed }
      signatures { public_id email link { short_link } }
    }
  }
`

async function autentiqueGraphql(key, query, variables) {
  const r = await fetch(AUTENTIQUE_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  const data = await r.json()
  if (!r.ok || data.errors) {
    throw new Error(data?.errors?.[0]?.message || 'Erro na API do Autentique')
  }
  return data.data
}

// Gera o link de assinatura do signatário (o short_link nem sempre vem no createDocument).
async function gerarLink(key, publicId) {
  const data = await autentiqueGraphql(key, CREATE_LINK, { public_id: publicId })
  return data?.createLinkToSignature?.short_link || null
}

// Consulta o documento no Autentique: resolve o link de assinatura e se já está assinado.
async function sincronizarDocumento(key, autentiqueId, signerEmail) {
  const data = await autentiqueGraphql(key, GET_DOC, { id: autentiqueId })
  const doc = data?.document
  const sigs = doc?.signatures || []
  const signature = sigs.find((s) => s.email === signerEmail) || sigs[0]
  if (!signature) throw new Error('Documento sem signatário correspondente')

  let link = signature.link?.short_link || null
  if (!link && signature.public_id) {
    try {
      link = await gerarLink(key, signature.public_id)
    } catch {
      link = null
    }
  }
  const signedUrl = doc?.files?.signed || null
  return { link, signedUrl, assinado: !!signedUrl }
}

async function sbGetContrato(id) {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const r = await fetch(`${url}/rest/v1/contratos?id=eq.${encodeURIComponent(id)}&select=*`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  const data = await r.json()
  return Array.isArray(data) ? data[0] : null
}

async function sbUpdateContrato(id, patch) {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const r = await fetch(`${url}/rest/v1/contratos?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(patch),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data?.message || 'Falha ao atualizar contrato')
  return Array.isArray(data) ? data[0] : data
}

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

    // Ação: sincronizar um contrato existente (link + status) sem consumir documento.
    if (body.action === 'refresh-link') {
      const contrato = await sbGetContrato(body.contratoId)
      if (!contrato) return res.status(404).json({ error: 'Contrato não encontrado' })
      const { link, signedUrl, assinado } = await sincronizarDocumento(
        key,
        contrato.autentique_id,
        contrato.signatario_email
      )
      const patch = {}
      if (link && link !== contrato.link_assinatura) patch.link_assinatura = link
      if (assinado && contrato.status !== 'assinado') {
        patch.status = 'assinado'
        patch.signed_at = new Date().toISOString()
        if (signedUrl) patch.arquivo_url = signedUrl
      }
      const atualizado = Object.keys(patch).length
        ? await sbUpdateContrato(contrato.id, patch)
        : contrato
      return res.status(200).json({ contrato: atualizado, link, assinado })
    }

    // Ação: importar um documento que já existe no Autentique para o CRM
    // (ex.: contrato criado mas não salvo por falha anterior).
    if (body.action === 'importar') {
      const { clienteId, titulo, signerEmail, autentiqueId } = body
      if (!clienteId || !autentiqueId) {
        return res.status(400).json({ error: 'Informe cliente e o id do documento' })
      }
      const { link, signedUrl, assinado } = await sincronizarDocumento(key, autentiqueId, signerEmail)
      const contrato = await sbInsert({
        cliente_id: clienteId,
        titulo: titulo || 'Contrato',
        autentique_id: autentiqueId,
        status: assinado ? 'assinado' : 'enviado',
        signatario_email: signerEmail || null,
        link_assinatura: link,
        arquivo_url: signedUrl || null,
        signed_at: assinado ? new Date().toISOString() : null,
      })
      return res.status(200).json({ contrato })
    }

    const { clienteId, titulo, signerEmail, fileBase64, fileName, createdBy, sandbox } = body

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
        sandbox: !!sandbox,
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

    // Só falha se o documento NÃO foi criado. Se veio com id, segue mesmo que o
    // Autentique tenha retornado avisos (ex.: "without_action_in_document").
    const doc = data?.data?.createDocument
    if (!doc?.id) {
      const msg = data?.errors?.[0]?.message || 'Erro ao criar documento no Autentique'
      return res.status(502).json({ error: msg })
    }

    const signature = (doc.signatures || []).find((s) => s.email === signerEmail) || doc.signatures?.[0]
    let link = signature?.link?.short_link || null
    // Geração do link não pode derrubar o salvamento: se falhar, salva sem link
    // (dá pra gerar depois com o botão "Gerar link").
    if (!link && signature?.public_id) {
      try {
        link = await gerarLink(key, signature.public_id)
      } catch {
        link = null
      }
    }

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
