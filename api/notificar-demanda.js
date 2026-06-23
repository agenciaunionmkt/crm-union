// Função serverless (Vercel) — envia e-mail ao cliente quando um conteúdo
// fica "Aguardando aprovação". Usa a API do Resend.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const key = process.env.RESEND_API_KEY
  if (!key) return res.status(500).json({ error: 'E-mail não configurado (defina RESEND_API_KEY no Vercel)' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const { email, nome, titulo } = body
    if (!email || !titulo) return res.status(400).json({ error: 'Informe e-mail e título' })

    const portalUrl = 'https://www.agenciaunionmkt.com.br/portal/calendario'
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
        <p>Olá ${nome || ''},</p>
        <p>Um novo conteúdo está <strong>aguardando a sua aprovação</strong>:</p>
        <p style="font-size:16px"><strong>${titulo}</strong></p>
        <p>Acesse o portal para visualizar e aprovar:</p>
        <p>
          <a href="${portalUrl}"
             style="display:inline-block;background:#facc15;color:#0a0b0e;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700">
            Ver no portal
          </a>
        </p>
        <p style="color:#888;font-size:12px;margin-top:24px">Union Marketing</p>
      </div>`

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Union Marketing <acesso@agenciaunionmkt.com.br>',
        to: [email],
        subject: `Conteúdo aguardando aprovação: ${titulo}`,
        html,
      }),
    })
    const data = await r.json()
    if (!r.ok) return res.status(502).json({ error: data?.message || 'Falha ao enviar e-mail' })
    return res.status(200).json({ ok: true, id: data.id })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erro inesperado' })
  }
}
