// Função serverless (Vercel Cron, diária) — apaga do Storage os arquivos com
// mais de 30 dias (menos a aba Materiais do cliente) e limpa as referências no
// banco via RPC limpar_arquivos_vencidos (supabase/migration_limpeza_arquivos.sql).

const DIAS = 30

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Não autorizado' })
  }

  const SB = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }

  const r = await fetch(`${SB}/rest/v1/rpc/limpar_arquivos_vencidos`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ dias: DIAS }),
  })
  if (!r.ok) return res.status(500).json({ error: await r.text() })
  const itens = await r.json()

  const porBucket = {}
  for (const { bucket, caminho } of itens) (porBucket[bucket] ||= []).push(caminho)

  // ponytail: a RPC devolve no máx. 1000 por chamada; o resto sai nas execuções seguintes
  let removidos = 0
  for (const [bucket, caminhos] of Object.entries(porBucket)) {
    for (let i = 0; i < caminhos.length; i += 100) {
      const d = await fetch(`${SB}/storage/v1/object/${bucket}`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ prefixes: caminhos.slice(i, i + 100) }),
      })
      if (d.ok) removidos += (await d.json()).length
    }
  }

  return res.status(200).json({ encontrados: itens.length, removidos })
}
