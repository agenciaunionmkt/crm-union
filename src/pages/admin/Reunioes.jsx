import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Video, Trash2, Calendar } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { listClients } from '../../lib/api/clients'
import { listReunioes, createReuniao, deleteReuniao } from '../../lib/api/reunioes'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'

const DURACOES = [
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hora' },
  { value: '90', label: '1h30' },
  { value: '120', label: '2 horas' },
]

const HORARIOS = Array.from({ length: 31 }, (_, i) => {
  const totalMin = 7 * 60 + i * 30
  const h = String(Math.floor(totalMin / 60)).padStart(2, '0')
  const m = String(totalMin % 60).padStart(2, '0')
  return `${h}:${m}`
})

function buildGcalUrl({ titulo, descricao, inicio, duracao_min, email }) {
  const start = new Date(inicio)
  const end = new Date(start.getTime() + Number(duracao_min) * 60000)
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: titulo,
    dates: `${fmt(start)}/${fmt(end)}`,
  })
  if (descricao) params.set('details', descricao)
  if (email) params.set('add', email)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function formatHora(value) {
  return new Date(value).toLocaleString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

export default function Reunioes() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [titulo, setTitulo] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [emailConvidado, setEmailConvidado] = useState('')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('10:00')
  const [duracao, setDuracao] = useState('60')
  const [descricao, setDescricao] = useState('')

  const { data: reunioes = [], isLoading } = useQuery({ queryKey: ['reunioes'], queryFn: listReunioes })
  const { data: clientes = [] } = useQuery({ queryKey: ['clients'], queryFn: listClients })

  function handleClienteChange(e) {
    const id = e.target.value
    setClienteId(id)
    const c = clientes.find((cl) => cl.id === id)
    setEmailConvidado(c?.contato_email ?? '')
  }

  const createMutation = useMutation({
    mutationFn: () => {
      const inicio = new Date(`${data}T${hora}:00`).toISOString()
      const link = buildGcalUrl({
        titulo,
        descricao: descricao || null,
        inicio,
        duracao_min: duracao,
        email: emailConvidado || null,
      })
      return createReuniao({
        cliente_id: clienteId || null,
        titulo,
        descricao: descricao || null,
        inicio,
        link,
        criado_por: profile?.id ?? null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunioes'] })
      setTitulo(''); setClienteId(''); setEmailConvidado('')
      setData(''); setHora('10:00'); setDuracao('60'); setDescricao('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteReuniao,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reunioes'] }),
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!titulo.trim() || !data) return
    createMutation.mutate()
  }

  const agora = Date.now()
  const proximas = reunioes.filter((r) => new Date(r.inicio).getTime() >= agora - 60 * 60 * 1000)
  const passadas = reunioes.filter((r) => new Date(r.inicio).getTime() < agora - 60 * 60 * 1000)

  function ReuniaoItem({ r }) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <Calendar className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{r.titulo}</p>
          <p className="text-xs text-subtle">
            {formatHora(r.inicio)}{r.client?.nome ? ` · ${r.client.nome}` : ''}
          </p>
        </div>
        {r.link && (
          <a
            href={r.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:opacity-90 transition-colors"
          >
            <Video className="h-3.5 w-3.5" /> Meet
          </a>
        )}
        <button
          type="button"
          onClick={() => deleteMutation.mutate(r.id)}
          className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-danger transition-colors"
          title="Remover"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Reuniões</h1>
        <p className="mt-1 text-sm text-muted">Agende calls — o link do Google Calendar (Meet) é gerado automaticamente</p>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Título"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Alinhamento mensal"
          />
          <Select label="Cliente (opcional)" value={clienteId} onChange={handleClienteChange}>
            <option value="">Reunião interna / sem cliente</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select>
          <Input
            label="E-mail do convidado"
            type="email"
            value={emailConvidado}
            onChange={(e) => setEmailConvidado(e.target.value)}
            placeholder="email@cliente.com.br"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="[color-scheme:dark]"
            />
            <Select label="Hora" value={hora} onChange={(e) => setHora(e.target.value)}>
              {HORARIOS.map((h) => <option key={h} value={h}>{h}</option>)}
            </Select>
          </div>
          <Select label="Duração" value={duracao} onChange={(e) => setDuracao(e.target.value)}>
            {DURACOES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </Select>
        </div>
        <div className="mt-4">
          <Textarea
            label="Pauta (opcional)"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Tópicos da reunião..."
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending || !titulo.trim() || !data}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {createMutation.isPending ? 'Agendando...' : 'Agendar reunião'}
          </button>
          {createMutation.error && <span className="text-xs text-danger">{createMutation.error.message}</span>}
          {clienteId && <span className="text-xs text-muted">Aparecerá no portal do cliente.</span>}
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-widest text-subtle">Próximas</h2>
        <div className="mt-3 space-y-2">
          {isLoading && <p className="text-sm text-muted">Carregando...</p>}
          {!isLoading && proximas.length === 0 && <p className="text-sm text-muted">Nenhuma reunião agendada.</p>}
          {proximas.map((r) => <ReuniaoItem key={r.id} r={r} />)}
        </div>
      </div>

      {passadas.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-widest text-subtle">Anteriores</h2>
          <div className="mt-3 space-y-2 opacity-60">
            {passadas.slice(0, 10).map((r) => <ReuniaoItem key={r.id} r={r} />)}
          </div>
        </div>
      )}
    </div>
  )
}
