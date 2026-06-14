import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Wand2, Loader2, Trash2, CheckCircle } from 'lucide-react'
import { listClients, getBriefing } from '../../lib/api/clients'
import { createDemandsBulk } from '../../lib/api/demands'
import { postsDoPlano, labelDoPlano } from '../../lib/plans'

export default function AgenteConteudo() {
  const navigate = useNavigate()
  const [clienteId, setClienteId] = useState('')
  const [mes, setMes] = useState(format(new Date(), 'yyyy-MM'))
  const [quantidade, setQuantidade] = useState(12)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: listClients })
  const { data: briefing } = useQuery({
    queryKey: ['briefings', clienteId],
    queryFn: () => getBriefing(clienteId),
    enabled: !!clienteId,
  })

  const cliente = clients.find((c) => c.id === clienteId)

  function selecionarCliente(id) {
    setClienteId(id)
    const c = clients.find((x) => x.id === id)
    const qtd = postsDoPlano(c?.plano)
    if (qtd) setQuantidade(qtd)
    setPosts([])
    setDone('')
  }

  async function gerar() {
    if (!clienteId) {
      setError('Selecione um cliente')
      return
    }
    setError('')
    setDone('')
    setLoading(true)
    try {
      const contexto = [
        briefing?.tom_de_voz ? `Tom de voz: ${briefing.tom_de_voz}` : '',
        briefing?.regras_marca ? `Regras de marca: ${briefing.regras_marca}` : '',
      ].filter(Boolean).join('\n')
      const res = await fetch('/api/agente-conteudo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: cliente?.nome,
          segmento: cliente?.segmento,
          contexto,
          mesLabel: format(new Date(`${mes}-01T00:00:00`), "MMMM 'de' yyyy", { locale: ptBR }),
          quantidade,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao gerar conteúdo')
      setPosts(data.posts || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function removerPost(i) {
    setPosts((p) => p.filter((_, idx) => idx !== i))
  }

  async function criarDemandas() {
    if (posts.length === 0) return
    setCreating(true)
    setError('')
    try {
      const [year, month] = mes.split('-').map(Number)
      const ultimoDia = new Date(year, month, 0).getDate()
      const payloads = posts.map((p) => {
        const dia = Math.min(p.dia, ultimoDia)
        const prazo = `${mes}-${String(dia).padStart(2, '0')}`
        const descricao = [p.legenda, p.hashtags].filter(Boolean).join('\n\n')
        return {
          cliente_id: clienteId,
          titulo: `[${p.tipo}] ${p.titulo}`,
          descricao,
          status: 'a_fazer',
          prazo,
        }
      })
      await createDemandsBulk(payloads)
      setDone(`${payloads.length} demandas criadas no cronograma!`)
      setPosts([])
    } catch (e) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <Wand2 className="w-5 h-5 text-yellow-400" />
        <h1 className="text-2xl font-normal text-white">Agente de conteúdo</h1>
      </div>
      <p className="mt-1 text-sm text-neutral-400">Gere o calendário de posts do mês e crie as demandas automaticamente</p>

      {/* Controles */}
      <div className="mt-6 glass rounded-2xl p-5 grid gap-4 sm:grid-cols-[1fr_160px_120px_auto] items-end">
        <div>
          <label className="mb-1.5 block text-xs text-neutral-400">Cliente</label>
          <select
            value={clienteId}
            onChange={(e) => selecionarCliente(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-yellow-400/50 focus:outline-none"
          >
            <option value="">Selecione...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}{c.plano ? ` — ${labelDoPlano(c.plano)}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-neutral-400">Mês</label>
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-yellow-400/50 focus:outline-none [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-neutral-400">Qtd. posts</label>
          <input
            type="number"
            min="1"
            max="31"
            value={quantidade}
            onChange={(e) => setQuantidade(parseInt(e.target.value, 10) || 1)}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-yellow-400/50 focus:outline-none"
          />
        </div>
        <button
          onClick={gerar}
          disabled={loading || !clienteId}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-yellow-500 disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {loading ? 'Gerando...' : 'Gerar'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {done && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-4 py-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <p className="text-sm text-emerald-300">{done}</p>
          <button onClick={() => navigate('/admin/demandas')} className="ml-auto text-xs text-emerald-300 underline">
            Ver no cronograma
          </button>
        </div>
      )}

      {/* Preview */}
      {posts.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-neutral-400">{posts.length} posts gerados — revise e crie as demandas</p>
            <button
              onClick={criarDemandas}
              disabled={creating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-500 disabled:opacity-60 transition-colors"
            >
              {creating ? 'Criando...' : 'Criar demandas no cronograma'}
            </button>
          </div>
          <div className="space-y-2">
            {posts.map((p, i) => (
              <div key={i} className="glass rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] uppercase text-violet-200">{p.tipo}</span>
                      <span className="text-xs text-neutral-400">Dia {p.dia}</span>
                    </div>
                    <p className="mt-1 text-sm font-normal text-white">{p.titulo}</p>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-neutral-300">{p.legenda}</p>
                    {p.hashtags && <p className="mt-1 text-xs text-neutral-500">{p.hashtags}</p>}
                  </div>
                  <button
                    onClick={() => removerPost(i)}
                    className="flex-shrink-0 p-1.5 rounded text-neutral-400 hover:text-red-500 hover:bg-red-900/20 transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
