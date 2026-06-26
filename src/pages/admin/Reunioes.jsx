import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Video, Trash2, Calendar } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { listClients } from '../../lib/api/clients'
import { listReunioes, createReuniao, deleteReuniao } from '../../lib/api/reunioes'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'

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
  const [inicio, setInicio] = useState('')
  const [link, setLink] = useState('')
  const [descricao, setDescricao] = useState('')

  const { data: reunioes = [], isLoading } = useQuery({ queryKey: ['reunioes'], queryFn: listReunioes })
  const { data: clientes = [] } = useQuery({ queryKey: ['clients'], queryFn: listClients })

  const createMutation = useMutation({
    mutationFn: () =>
      createReuniao({
        cliente_id: clienteId || null,
        titulo,
        descricao: descricao || null,
        inicio: new Date(inicio).toISOString(),
        link: link || null,
        criado_por: profile?.id ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunioes'] })
      setTitulo(''); setClienteId(''); setInicio(''); setLink(''); setDescricao('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteReuniao,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reunioes'] }),
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!titulo.trim() || !inicio) return
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
          <a href={r.link} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-white/5 transition-colors">
            <Video className="h-3.5 w-3.5" /> Entrar
          </a>
        )}
        <button type="button" onClick={() => deleteMutation.mutate(r.id)}
          className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-danger transition-colors" title="Remover">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Reuniões</h1>
        <p className="mt-1 text-sm text-muted">Agende calls e receba alarme + popup 30 min antes e na hora</p>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Alinhamento mensal" />
          <Select label="Cliente (opcional)" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Reunião interna / sem cliente</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select>
          <Input label="Data e hora" type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} className="[color-scheme:dark]" />
          <Input label="Link da call (opcional)" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://meet.google.com/..." />
        </div>
        <div className="mt-4">
          <Textarea label="Descrição (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Pauta, observações..." />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button type="submit" disabled={createMutation.isPending || !titulo.trim() || !inicio}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50 transition-colors">
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
