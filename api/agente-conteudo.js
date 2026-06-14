// Função serverless (Vercel) — Agente de conteúdo via Groq.
// Gera um calendário de posts do mês para um cliente (JSON).

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
    const { cliente, segmento, contexto, mesLabel, quantidade } = body
    const qtd = Math.max(1, Math.min(31, parseInt(quantidade, 10) || 12))

    const prompt =
      `Você é estrategista de conteúdo de uma agência de marketing. ` +
      `Crie um calendário de ${qtd} posts para o cliente "${cliente || 'cliente'}" ` +
      `(segmento: ${segmento || 'não informado'}) para o mês de ${mesLabel || 'referência'}. ` +
      (contexto ? `Considere o tom de voz e regras da marca:\n${contexto}\n` : '') +
      `Distribua os posts ao longo do mês em dias variados (campo "dia" = número do dia, 1 a 28). ` +
      `Varie os formatos (feed, carrossel, reels, story). ` +
      `Para cada post, escreva uma legenda pronta para publicar e hashtags relevantes. ` +
      `Responda SOMENTE com um JSON válido no formato: ` +
      `{"posts":[{"dia":1,"tipo":"feed","titulo":"...","legenda":"...","hashtags":"#a #b"}]}. ` +
      `Sem texto fora do JSON.`

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    })

    const data = await r.json()
    if (!r.ok) {
      return res.status(502).json({ error: data?.error?.message || 'Erro no provedor de IA' })
    }

    let posts = []
    try {
      const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}')
      posts = Array.isArray(parsed.posts) ? parsed.posts : []
    } catch {
      posts = []
    }

    posts = posts
      .filter((p) => p && p.titulo)
      .slice(0, qtd)
      .map((p) => ({
        dia: Math.max(1, Math.min(28, parseInt(p.dia, 10) || 1)),
        tipo: p.tipo || 'feed',
        titulo: String(p.titulo).slice(0, 200),
        legenda: String(p.legenda || ''),
        hashtags: String(p.hashtags || ''),
      }))

    return res.status(200).json({ posts })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erro inesperado' })
  }
}
