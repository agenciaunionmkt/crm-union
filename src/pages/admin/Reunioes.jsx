import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Video, Trash2, Calendar, Plus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { listClients } from '../../lib/api/clients'
import { listReunioes, createReuniao, deleteReuniao } from '../../lib/api/reunioes'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Modal from '../../components/ui/Modal'
import DateSelect from '../../components/ui/DateSelect'

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

function ReuniaoForm({ clientes, onSave, isPending, onClose }) {
  const [titulo, setTitulo] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [emailConvidado, setEmailConvidado] = useState('')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('10:00')
  const [duracao, setDuracao] = useState('60')
  const [descricao, setDescricao] = useState('')

  function handleClienteChange(e) {
    const id = e.target.value
    setClienteId(id)
    const c = clientes.find((cl) => cl.id === id)
    setEmailConvidado(c?.contato_email ?? '')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!titulo.trim() || !data) return
    const inicio = new Date(`${data}T${hora}:00`).toISOString()
    const link = buildGcalUrl({ titulo, descricao: descricao || null, inicio, duracao_min: duracao, email: emailConvidado || null })
    onSave({ cliente_id: clienteId || null, titulo, descricao: descricao || null, inicio, link })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <DateSelect label="Data" value={data} onChange={setData} />
        <Select label="Hora" value={hora} onChange={(e) => setHora(e.target.value)}>
          {HORARIOS.map((h) => <option key={h} value={h}>{h}</option>)}
        </Select>
        <Select label="Duração" value={duracao} onChange={(e) => setDuracao(e.target.value)}>
          {DURACOES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </Select>
      </div>
      <Textarea
        label="Pauta (opcional)"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="Tópicos da reunião..."
      />
      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted hover:bg-white/5 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending || !titulo.trim() || !data}
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Agendando...' : 'Agendar reunião'}
        </button>
      </div>
    </form>
  )
}

export default function Reunioes() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: reunioes = [], isLoading } = useQuery({ queryKey: ['reunioes'], queryFn: listReunioes })
  const { data: clientes = [] } = useQuery({ queryKey: ['clients'], queryFn: listClients })

  const createMutation = useMutation({
    mutationFn: (payload) => createReuniao({ ...payload, criado_por: profile?.id ?? null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunioes'] })
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteReuniao,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reunioes'] }),
  })

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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Reuniões</h1>
          <p className="mt-1 text-sm text-muted">Agende calls — o link do Google Calendar (Meet) é gerado automaticamente</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 transition-colors active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Agendar reunião
        </button>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-widest text-subtle">Próximas</h2>
        {isLoading && <p className="text-sm text-muted">Carregando...</p>}
        {!isLoading && proximas.length === 0 && (
          <p className="text-sm text-muted">Nenhuma reunião agendada.</p>
        )}
        {proximas.map((r) => <ReuniaoItem key={r.id} r={r} />)}
      </div>

      {passadas.length > 0 && (
        <div className="mt-8 space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-widest text-subtle">Anteriores</h2>
          <div className="opacity-60">
            {passadas.slice(0, 10).map((r) => <ReuniaoItem key={r.id} r={r} />)}
          </div>
        </div>
      )}

      <Modal open={showForm} title="Agendar reunião" onClose={() => setShowForm(false)} maxWidth="max-w-xl">
        <ReuniaoForm
          clientes={clientes}
          onSave={(payload) => createMutation.mutate(payload)}
          isPending={createMutation.isPending}
          onClose={() => setShowForm(false)}
        />
      </Modal>
    </div>
  )
}
