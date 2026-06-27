import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Video, Trash2, Plus, Clock, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { listClients } from '../../lib/api/clients'
import { listReunioes, createReuniao, deleteReuniao } from '../../lib/api/reunioes'
import { fieldBase, fieldBorder } from '../../components/ui/Input'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Modal from '../../components/ui/Modal'
import DatePicker from '../../components/ui/DatePicker'

const DURACOES = ['30 min', '45 min', '1 hora', '1h30', '2 horas']
const DURACAO_VALS = ['30', '45', '60', '90', '120']

// 07:00 a 22:45 em intervalos de 15 min
const HORARIOS = Array.from({ length: 64 }, (_, i) => {
  const totalMin = 7 * 60 + i * 15
  const h = String(Math.floor(totalMin / 60)).padStart(2, '0')
  const m = String(totalMin % 60).padStart(2, '0')
  return `${h}:${m}`
})


function buildGcalUrl({ titulo, descricao, inicio, duracao_min = 60 }) {
  const start = new Date(inicio)
  const end = new Date(start.getTime() + Number(duracao_min) * 60000)
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const params = new URLSearchParams({ action: 'TEMPLATE', text: titulo, dates: `${fmt(start)}/${fmt(end)}` })
  if (descricao) params.set('details', descricao)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
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

  const sel = `${fieldBase} ${fieldBorder(false)} [color-scheme:dark]`

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Alinhamento mensal" />

      <Textarea label="Pauta (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Tópicos da reunião..." rows={3} />

      <div className="space-y-2">
        <p className="text-sm font-medium text-muted">Com quem</p>
        <div className="grid grid-cols-2 gap-2">
          <select value={clienteId} onChange={handleClienteChange} className={sel} aria-label="Cliente">
            <option value="">Sem cliente / externo</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <input type="email" value={emailConvidado} onChange={(e) => setEmailConvidado(e.target.value)} placeholder="E-mail (convite)" className={`${fieldBase} ${fieldBorder(false)}`} aria-label="E-mail do convidado" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <DatePicker label="Data" value={data} onChange={setData} />
        <div className="w-full">
          <label className="mb-1.5 block text-sm font-medium text-muted">Hora</label>
          <select value={hora} onChange={(e) => setHora(e.target.value)} className={sel} aria-label="Hora">
            {HORARIOS.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div className="w-full">
          <label className="mb-1.5 block text-sm font-medium text-muted">Duração</label>
          <select value={duracao} onChange={(e) => setDuracao(e.target.value)} className={sel} aria-label="Duração">
            {DURACAO_VALS.map((v, i) => <option key={v} value={v}>{DURACOES[i]}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm text-muted hover:bg-white/5 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={isPending || !titulo.trim() || !data} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50 transition-colors">
          {isPending ? 'Agendando...' : 'Agendar reunião'}
        </button>
      </div>
    </form>
  )
}

function ReuniaoItem({ r, past, onDelete }) {
  const start = new Date(r.inicio)
  const mes = start.toLocaleDateString('pt-BR', { month: 'short' })
  const hora = start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return (
    <div className={`flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-opacity ${past ? 'opacity-50' : ''}`}>
      {/* Bloco de data */}
      <div className="flex w-14 flex-shrink-0 flex-col items-center rounded-lg bg-surface-2 py-2">
        <span className="text-[10px] uppercase tracking-widest text-subtle">{mes}</span>
        <span className="font-display text-2xl font-black leading-none text-foreground">{start.getDate()}</span>
      </div>

      {/* Conteúdo */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{r.titulo}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-subtle">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {hora}
          </span>
          {r.client?.nome && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {r.client.nome}
            </span>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-shrink-0 items-center gap-1">
        {!past && r.link && (
          <a
            href={r.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs text-foreground hover:bg-white/5 transition-colors"
          >
            <Video className="h-3.5 w-3.5" /> Meet
          </a>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-danger transition-colors"
          title="Remover"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
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

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Reuniões</h1>
          <p className="mt-1 text-sm text-muted">Agende calls — o link do Meet é gerado automaticamente</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 transition-colors active:scale-95"
        >
          <Plus className="h-4 w-4" /> Agendar reunião
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-widest text-subtle">Próximas</p>
        {isLoading && <p className="text-sm text-muted">Carregando...</p>}
        {!isLoading && proximas.length === 0 && (
          <p className="text-sm text-muted">Nenhuma reunião agendada.</p>
        )}
        {proximas.map((r) => (
          <ReuniaoItem key={r.id} r={r} past={false} onDelete={() => deleteMutation.mutate(r.id)} />
        ))}
      </div>

      {passadas.length > 0 && (
        <div className="mt-8 space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-widest text-subtle">Realizadas</p>
          {passadas.slice(0, 10).map((r) => (
            <ReuniaoItem key={r.id} r={r} past onDelete={() => deleteMutation.mutate(r.id)} />
          ))}
        </div>
      )}

      <Modal open={showForm} title="Agendar reunião" onClose={() => setShowForm(false)} maxWidth="max-w-xl">
        <ReuniaoForm
          clientes={clientes}
          onSave={(p) => createMutation.mutate(p)}
          isPending={createMutation.isPending}
          onClose={() => setShowForm(false)}
        />
      </Modal>
    </div>
  )
}
