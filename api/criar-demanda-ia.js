// Função serverless (Vercel) — interpreta um pedido em linguagem natural e
// devolve um rascunho de demanda (cliente, título, descrição, data sugerida).
// Nada é criado aqui — o app mostra a prévia e o usuário confirma.

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
    const pedido = (body.pedido || '').trim()
    const clientes = Array.isArray(body.clientes) ? body.clientes : []
    const hoje = body.hoje || new Date().toISOString().split('T')[0]
    if (!pedido) return res.status(400).json({ error: 'Descreva o pedido' })

    const prompt =
      `Você ajuda uma agência de marketing a criar demandas a partir de um pedido em linguagem natural.\n` +
      `Hoje é ${hoje} (use para resolver datas relativas como "sexta", "dia das mães", "próxima semana").\n` +
      `Clientes disponíveis: ${clientes.join(', ') || 'nenhum'}.\n\n` +
      `Pedido do usuário: "${pedido}"\n\n` +
      `Responda SOMENTE com JSON válido no formato: ` +
      `{"cliente":"<nome EXATO da lista de clientes mencionado, ou string vazia>",` +
      `"titulo":"<título curto da demanda>",` +
      `"descricao":"<descrição profissional, com legenda/escopo quando fizer sentido>",` +
      `"data":"<yyyy-mm-dd se houver data indicada, senão string vazia>"}. ` +
      `Sem texto fora do JSON.`

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    })
    const data = await r.json()
    if (!r.ok) return res.status(502).json({ error: data?.error?.message || 'Erro no provedor de IA' })

    let rascunho = {}
    try {
      rascunho = JSON.parse(data.choices?.[0]?.message?.content || '{}')
    } catch {
      rascunho = {}
    }

    return res.status(200).json({
      cliente: rascunho.cliente || '',
      titulo: rascunho.titulo || '',
      descricao: rascunho.descricao || '',
      data: /^\d{4}-\d{2}-\d{2}$/.test(rascunho.data) ? rascunho.data : '',
    })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erro inesperado' })
  }
}
