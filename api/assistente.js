// Função serverless (Vercel) — Assistente de conteúdo (chat) via Groq.
// Mantém a conversa (histórico) e responde focado em marketing.

const SYSTEM_PROMPT =
  'Você é o Assistente de Conteúdo da Union Marketing, uma agência de marketing. ' +
  'Ajude a equipe a criar legendas para redes sociais, ideias de pauta, calendários de conteúdo, ' +
  'roteiros de Reels e Stories, hashtags, textos de anúncios, e-mails e estratégias. ' +
  'Responda sempre em português do Brasil, de forma objetiva e pronta para uso. ' +
  'Quando gerar conteúdo para redes, ofereça opções e inclua hashtags quando fizer sentido. ' +
  'Seja direto e evite enrolação.'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const key = process.env.GROQ_API_KEY
  if (!key) {
    return res.status(500).json({ error: 'IA não configurada (defina GROQ_API_KEY no Vercel)' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const messages = Array.isArray(body.messages) ? body.messages : []
    if (messages.length === 0) {
      return res.status(400).json({ error: 'Envie ao menos uma mensagem' })
    }

    const contexto = typeof body.context === 'string' ? body.context.trim() : ''
    const systemContent = contexto
      ? `${SYSTEM_PROMPT}\n\nContexto da marca/cliente para personalizar as respostas (use o tom de voz e as regras abaixo):\n${contexto}`
      : SYSTEM_PROMPT

    // Mantém só as últimas 14 mensagens para não estourar o contexto
    const recentes = messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
      .slice(-14)

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemContent }, ...recentes],
        temperature: 0.8,
        max_tokens: 1024,
      }),
    })

    const data = await r.json()
    if (!r.ok) {
      return res.status(502).json({ error: data?.error?.message || 'Erro no provedor de IA' })
    }

    const texto = data?.choices?.[0]?.message?.content?.trim() || ''
    return res.status(200).json({ texto })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erro inesperado' })
  }
}
