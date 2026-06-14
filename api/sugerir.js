// Função serverless (Vercel) — sugestão de descrição de demanda via Groq (grátis).
// Chave fica no servidor (env GROQ_API_KEY), nunca exposta no frontend.

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
    const { titulo, contexto } = body
    if (!titulo) {
      return res.status(400).json({ error: 'Título é obrigatório' })
    }

    const prompt =
      'Você é assistente de uma agência de marketing. Escreva uma descrição de demanda ' +
      'objetiva e profissional em português do Brasil para a tarefa abaixo. ' +
      'Inclua um escopo resumido em tópicos e o que será entregue. ' +
      'Seja conciso (no máximo ~120 palavras). Não invente prazos nem valores.\n\n' +
      `Título: ${titulo}` +
      (contexto ? `\nCliente/Contexto: ${contexto}` : '')

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 400,
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
