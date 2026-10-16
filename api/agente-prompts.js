// Função serverless (Vercel) — entrega à rotina de prompts (agendada no Claude
// do JR) as demandas criadas numa janela de tempo, com cliente, briefing,
// etiquetas e anexos. Somente leitura, protegida por token próprio.

import { timingSafeEqual } from 'node:crypto'

function tokenValido(recebido, esperado) {
  if (!recebido || !esperado) return false
  const a = Buffer.from(recebido)
  const b = Buffer.from(esperado)
  return a.length === b.length && timingSafeEqual(a, b)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const recebido = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!tokenValido(recebido, process.env.AGENTE_PROMPTS_TOKEN)) {
    return res.status(401).json({ error: 'Não autorizado' })
  }

  const desde = new Date(req.query.desde || Date.now() - 24 * 60 * 60 * 1000)
  if (Number.isNaN(desde.getTime())) {
    return res.status(400).json({ error: 'Parâmetro "desde" inválido' })
  }

  // "agora" fecha a janela: a próxima execução usa esse valor como "desde",
  // então nenhuma demanda fica de fora nem é processada duas vezes.
  const agora = new Date().toISOString()
  const select = [
    'id', 'titulo', 'descricao', 'prazo', 'status', 'created_at',
    'cliente:clients(nome,segmento,plano_descricao,briefings(tom_de_voz,referencias,regras_marca))',
    'tags:demand_tags(tag:tags(nome))',
    'anexos:attachments(nome_arquivo,arquivo_url,interno)',
  ].join(',')

  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const query =
    `select=${encodeURIComponent(select)}` +
    `&created_at=gt.${encodeURIComponent(desde.toISOString())}` +
    `&created_at=lte.${encodeURIComponent(agora)}` +
    '&order=created_at.asc'

  try {
    const r = await fetch(`${url}/rest/v1/demands?${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
    const data = await r.json()
    if (!r.ok) {
      return res.status(502).json({ error: data?.message || 'Falha ao ler as demandas' })
    }

    const demandas = data.map((d) => {
      const b = d.cliente?.briefings
      return {
        id: d.id,
        titulo: d.titulo,
        descricao: d.descricao,
        prazo: d.prazo,
        status: d.status,
        criada_em: d.created_at,
        cliente: d.cliente?.nome ?? null,
        segmento: d.cliente?.segmento ?? null,
        plano: d.cliente?.plano_descricao ?? null,
        briefing: (Array.isArray(b) ? b[0] : b) ?? null,
        etiquetas: (d.tags ?? []).map((t) => t.tag?.nome).filter(Boolean),
        anexos: d.anexos ?? [],
      }
    })

    return res.status(200).json({ desde: desde.toISOString(), agora, total: demandas.length, demandas })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
