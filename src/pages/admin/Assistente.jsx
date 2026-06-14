import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, Send, Loader2, Copy, Check, FilePlus, Trash2 } from 'lucide-react'
import { listClients, getBriefing } from '../../lib/api/clients'

const sugestoes = [
  'Crie 3 opções de legenda para um post de lançamento de produto, com hashtags.',
  'Monte uma pauta de conteúdo para Instagram para as próximas 2 semanas.',
  'Escreva um roteiro de Reels de 30 segundos sobre uma promoção.',
  'Gere 15 hashtags relevantes para o segmento de moda.',
]

const STORAGE_KEY = 'assistente_msgs'

export default function Assistente() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
      return []
    }
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [copiedIdx, setCopiedIdx] = useState(null)
  const bottomRef = useRef(null)

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: listClients })
  const { data: briefing } = useQuery({
    queryKey: ['briefings', clienteId],
    queryFn: () => getBriefing(clienteId),
    enabled: !!clienteId,
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)))
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, loading])

  function buildContext() {
    const cliente = clients.find((c) => c.id === clienteId)
    if (!cliente) return ''
    const partes = [`Cliente: ${cliente.nome}`]
    if (cliente.segmento) partes.push(`Segmento: ${cliente.segmento}`)
    if (briefing?.tom_de_voz) partes.push(`Tom de voz: ${briefing.tom_de_voz}`)
    if (briefing?.regras_marca) partes.push(`Regras de marca: ${briefing.regras_marca}`)
    if (briefing?.referencias) partes.push(`Referências: ${briefing.referencias}`)
    return partes.join('\n')
  }

  async function enviar(texto) {
    const conteudo = (texto ?? input).trim()
    if (!conteudo || loading) return
    setError('')
    setInput('')
    const novaConversa = [...messages, { role: 'user', content: conteudo }]
    setMessages(novaConversa)
    setLoading(true)
    try {
      const res = await fetch('/api/assistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: novaConversa, context: buildContext() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Não foi possível responder')
      setMessages((prev) => [...prev, { role: 'assistant', content: data.texto }])
    } catch (e) {
      setError(e.message || 'Erro ao falar com a IA')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    enviar()
  }

  async function copiar(texto, idx) {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 1500)
    } catch {
      /* ignore */
    }
  }

  function limpar() {
    setMessages([])
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h1 className="text-2xl font-normal text-white">Assistente IA</h1>
          </div>
          <p className="mt-1 text-sm text-neutral-400">Peça legendas, pautas, roteiros e ideias de conteúdo</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={limpar}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs text-neutral-300 hover:bg-white/5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Limpar
          </button>
        )}
      </div>

      {/* Contexto do cliente */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs text-neutral-400">Gerar no estilo de:</span>
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white focus:border-yellow-400/50 focus:outline-none"
        >
          <option value="">Genérico (sem cliente)</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        {clienteId && (
          <span className="text-xs text-emerald-400">usando tom de voz e regras da marca</span>
        )}
      </div>

      <div className="mt-4 h-[58vh] glass rounded-2xl p-5 flex flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto px-1 py-1">
          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Sparkles className="w-8 h-8 text-yellow-400/70 mb-3" />
              <p className="text-sm text-neutral-300">Como posso ajudar com o conteúdo hoje?</p>
              <div className="mt-4 grid sm:grid-cols-2 gap-2 max-w-2xl">
                {sugestoes.map((s) => (
                  <button
                    key={s}
                    onClick={() => enviar(s)}
                    className="text-left rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-neutral-300 hover:bg-white/10 hover:border-white/20 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${m.role === 'user' ? '' : 'w-full sm:w-auto'}`}>
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-yellow-400 text-gray-900 rounded-br-sm'
                      : 'bg-white/8 text-neutral-100 border border-white/10 rounded-bl-sm'
                  }`}
                >
                  {m.content}
                </div>
                {m.role === 'assistant' && (
                  <div className="mt-1 flex gap-3 px-1">
                    <button
                      onClick={() => copiar(m.content, i)}
                      className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors"
                    >
                      {copiedIdx === i ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedIdx === i ? 'Copiado' : 'Copiar'}
                    </button>
                    <button
                      onClick={() => navigate('/admin/demandas', { state: { descricao: m.content } })}
                      className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-yellow-300 transition-colors"
                    >
                      <FilePlus className="w-3 h-3" /> Usar na demanda
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/8 px-3.5 py-2.5 text-sm text-neutral-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Gerando...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Descreva o conteúdo que você precisa..."
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-yellow-500 disabled:opacity-60 transition-colors"
          >
            <Send className="w-4 h-4" /> Enviar
          </button>
        </form>
      </div>
    </div>
  )
}
