import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Wand2, Loader2, Trash2, CheckCircle } from 'lucide-react'
import { listClients, getBriefing } from '../../lib/api/clients'
import { createDemandsBulk, createDemand } from '../../lib/api/demands'
import { postsDoCliente, labelDoPlano } from '../../lib/plans'
import DatePicker from '../../components/DatePicker'

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

  // --- Pedido rápido por IA (linguagem natural -> rascunho de demanda) ---
  const [pedido, setPedido] = useState('')
  const [rascunho, setRascunho] = useState(null)
  const [gerandoPedido, setGerandoPedido] = useState(false)
  const [criandoPedido, setCriandoPedido] = useState(false)
  const [pedidoMsg, setPedidoMsg] = useState('')
  const [pedidoErro, setPedidoErro] = useState('')

  async function gerarRascunho() {
    if (!pedido.trim()) return
    setGerandoPedido(true)
    setPedidoErro('')
    setPedidoMsg('')
    try {
      const res = await fetch('/api/criar-demanda-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido,
          clientes: clients.map((c) => c.nome),
          hoje: format(new Date(), 'yyyy-MM-dd'),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao interpretar o pedido')
      const match = clients.find((c) => c.nome.toLowerCase() === (data.cliente || '').toLowerCase())
      setRascunho({
        cliente_id: match?.id || '',
        titulo: data.titulo || '',
        descricao: data.descricao || '',
        data: data.data || '',
      })
    } catch (e) {
      setPedidoErro(e.message)
    } finally {
      setGerandoPedido(false)
    }
  }

  async function criarDemandaPedido() {
    if (!rascunho?.cliente_id) {
      setPedidoErro('Selecione o cliente')
      return
    }
    if (!rascunho?.data) {
      setPedidoErro('Defina a data')
      return
    }
    setCriandoPedido(true)
    setPedidoErro('')
    try {
      await createDemand({
        cliente_id: rascunho.cliente_id,
        titulo: rascunho.titulo,
        descricao: rascunho.descricao || null,
        status: 'a_fazer',
        prazo: rascunho.data,
      })
      setPedidoMsg('Demanda criada no cronograma do cliente!')
      setRascunho(null)
      setPedido('')
    } catch (e) {
      setPedidoErro(e.message)
    } finally {
      setCriandoPedido(false)
    }
  }

  function selecionarCliente(id) {
    setClienteId(id)
    const c = clients.find((x) => x.id === id)
    const qtd = postsDoCliente(c)
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
        <h1 className="text-2xl font-black tracking-tight text-foreground">Agente de conteúdo</h1>
      </div>
      <p className="mt-1 text-sm text-muted">Gere o calendário de posts do mês e crie as demandas automaticamente</p>

      {/* Pedido rápido por IA */}
      <div className="mt-6 glass rounded-2xl p-5">
        <p className="text-sm font-black tracking-tight text-foreground">Pedido rápido por IA</p>
        <p className="mt-0.5 text-xs text-muted">
          Descreva em linguagem natural e mencione o cliente. Ex: "post de promoção de dia das mães para o Depyl".
        </p>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={pedido}
            onChange={(e) => setPedido(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && gerarRascunho()}
            placeholder="Ex: gere um post de Black Friday para o cliente X na sexta"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
          />
          <button
            onClick={gerarRascunho}
            disabled={gerandoPedido || !pedido.trim()}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-normal text-accent hover:bg-accent/20 disabled:opacity-60 transition-colors"
          >
            {gerandoPedido ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            Interpretar
          </button>
        </div>

        {pedidoErro && <p className="mt-2 text-xs text-red-400">{pedidoErro}</p>}
        {pedidoMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <p className="text-xs text-emerald-300">{pedidoMsg}</p>
          </div>
        )}

        {rascunho && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-muted">Cliente</label>
                <select
                  value={rascunho.cliente_id}
                  onChange={(e) => setRascunho((r) => ({ ...r, cliente_id: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent/50 focus:outline-none"
                >
                  <option value="">Selecione...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Data</label>
                <DatePicker
                  value={rascunho.data}
                  onChange={(v) => setRascunho((r) => ({ ...r, data: v }))}
                  placeholder="Defina a data"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Título</label>
              <input
                value={rascunho.titulo}
                onChange={(e) => setRascunho((r) => ({ ...r, titulo: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Descrição</label>
              <textarea
                rows={4}
                value={rascunho.descricao}
                onChange={(e) => setRascunho((r) => ({ ...r, descricao: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent/50 focus:outline-none resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRascunho(null)}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm font-normal text-subtle hover:bg-white/5 transition-colors"
              >
                Descartar
              </button>
              <button
                onClick={criarDemandaPedido}
                disabled={criandoPedido}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-gray-900 hover:opacity-90 disabled:opacity-60 transition-colors"
              >
                {criandoPedido ? 'Criando...' : 'Criar demanda'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="mt-6 glass rounded-2xl p-5 grid gap-4 sm:grid-cols-[1fr_160px_120px_auto] items-end">
        <div>
          <label className="mb-1.5 block text-xs text-muted">Cliente</label>
          <select
            value={clienteId}
            onChange={(e) => selecionarCliente(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-accent/50 focus:outline-none"
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
          <label className="mb-1.5 block text-xs text-muted">Mês</label>
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-accent/50 focus:outline-none [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-muted">Qtd. posts</label>
          <input
            type="number"
            min="1"
            max="31"
            value={quantidade}
            onChange={(e) => setQuantidade(parseInt(e.target.value, 10) || 1)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-accent/50 focus:outline-none"
          />
        </div>
        <button
          onClick={gerar}
          disabled={loading || !clienteId}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-gray-900 hover:opacity-90 disabled:opacity-60 transition-colors"
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
            <p className="text-sm text-muted">{posts.length} posts gerados — revise e crie as demandas</p>
            <button
              onClick={criarDemandas}
              disabled={creating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-gray-900 hover:opacity-90 disabled:opacity-60 transition-colors"
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
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] uppercase text-accent">{p.tipo}</span>
                      <span className="text-xs text-muted">Dia {p.dia}</span>
                    </div>
                    <p className="mt-1 text-sm font-black tracking-tight text-foreground">{p.titulo}</p>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-subtle">{p.legenda}</p>
                    {p.hashtags && <p className="mt-1 text-xs text-muted">{p.hashtags}</p>}
                  </div>
                  <button
                    onClick={() => removerPost(i)}
                    className="flex-shrink-0 p-1.5 rounded text-muted hover:text-red-500 hover:bg-red-900/20 transition-colors"
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
