import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, ListTodo, Clock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react'
import { listClients } from '../../lib/api/clients'
import { listDemands } from '../../lib/api/demands'
import { demandStatusLabels, demandStatusStyles } from '../../lib/status'

const FEITAS = ['entregue', 'aprovado', 'concluido']
const PENDENTES = ['a_fazer', 'em_andamento']

export default function AdminDashboard() {
  const { profile } = useAuth()

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: listClients })
  const { data: demands = [] } = useQuery({ queryKey: ['demands'], queryFn: listDemands })

  const hojeStr = new Date().toISOString().split('T')[0]
  const nomeCliente = (id) => clients.find((c) => c.id === id)?.nome ?? '—'

  // Hoje
  const demandasHoje = demands.filter((d) => d.prazo === hojeStr)
  const pendentesHoje = demandasHoje.filter((d) => PENDENTES.includes(d.status))
  const feitasHoje = demandasHoje.filter((d) => FEITAS.includes(d.status))
  const progressoHoje = demandasHoje.length
    ? Math.round((feitasHoje.length / demandasHoje.length) * 100)
    : 0

  const aguardandoAprovacao = demands.filter((d) => d.status === 'entregue').length
  const atrasadas = demands.filter(
    (d) => d.prazo && d.prazo < hojeStr && !FEITAS.includes(d.status)
  )

  const clientesRecorrentes = clients.filter((c) => c.tipo_cliente === 'recorrente').length

  // Por status (todas as demandas)
  const statusCount = { a_fazer: 0, em_andamento: 0, entregue: 0, aprovado: 0, concluido: 0 }
  demands.forEach((d) => {
    if (statusCount[d.status] !== undefined) statusCount[d.status] += 1
  })
  const statusBars = [
    { key: 'a_fazer', count: statusCount.a_fazer, color: 'bg-neutral-400' },
    { key: 'em_andamento', count: statusCount.em_andamento, color: 'bg-violet-500' },
    { key: 'entregue', count: statusCount.entregue, color: 'bg-blue-500' },
    { key: 'aprovado', count: statusCount.aprovado, color: 'bg-emerald-500' },
    { key: 'concluido', count: statusCount.concluido, color: 'bg-green-500' },
  ]

  const metrics = [
    {
      label: 'Pendentes hoje',
      value: pendentesHoje.length,
      hint: `${feitasHoje.length} de ${demandasHoje.length} feitas`,
      icon: ListTodo,
      tone: 'text-yellow-300',
      bg: 'bg-yellow-400/10',
    },
    {
      label: 'Aguardando aprovação',
      value: aguardandoAprovacao,
      hint: 'do cliente',
      icon: Clock,
      tone: 'text-blue-300',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Atrasadas',
      value: atrasadas.length,
      hint: 'prazo vencido',
      icon: AlertTriangle,
      tone: 'text-red-300',
      bg: 'bg-red-500/10',
    },
    {
      label: 'Clientes ativos',
      value: clients.length,
      hint: `${clientesRecorrentes} recorrentes`,
      icon: Users,
      tone: 'text-foreground',
      bg: 'bg-white/5',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="pt-2">
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          Bem-vindo, {profile?.nome ?? 'usuário'}
        </h1>
        <p className="mt-1 text-sm text-muted">Visão geral da agência e do dia</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <div key={m.label} className="glass rounded-2xl p-5">
              <div className={`mb-3 inline-flex rounded-lg p-2 ${m.bg}`}>
                <Icon className={`h-5 w-5 ${m.tone}`} />
              </div>
              <p className="text-[11px] uppercase tracking-widest text-subtle">{m.label}</p>
              <p className={`mt-1 text-3xl font-black tracking-tight ${m.tone}`}>{m.value}</p>
              {m.hint && <p className="mt-1 text-xs text-muted">{m.hint}</p>}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Foco do dia */}
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-subtle">Foco do dia</p>
              <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground">
                Demandas de hoje
              </h2>
            </div>
            <Link
              to="/admin/demandas"
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
            >
              Ver cronograma <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Progresso do dia */}
          {demandasHoje.length > 0 && (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted">{feitasHoje.length} de {demandasHoje.length} concluídas</span>
                <span className="text-foreground">{progressoHoje}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progressoHoje}%` }} />
              </div>
            </div>
          )}

          <div className="mt-5 space-y-2">
            {demandasHoje.length === 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-6 text-sm text-muted">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Nenhuma demanda com prazo para hoje.
              </div>
            )}
            {/* Pendentes primeiro */}
            {[...pendentesHoje, ...feitasHoje].map((d) => {
              const feita = FEITAS.includes(d.status)
              return (
                <div
                  key={d.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
                >
                  <span className={`h-2 w-2 flex-shrink-0 rounded-full ${feita ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm ${feita ? 'text-muted line-through' : 'text-foreground'}`}>
                      {d.titulo}
                    </p>
                    <p className="text-xs text-subtle">{nomeCliente(d.cliente_id)}</p>
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${demandStatusStyles[d.status] ?? ''}`}>
                    {demandStatusLabels[d.status] ?? d.status}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Atrasadas (alerta) */}
          {atrasadas.length > 0 && (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
              <p className="flex items-center gap-2 text-sm text-red-300">
                <AlertTriangle className="h-4 w-4" />
                {atrasadas.length} demanda(s) atrasada(s) — revise no cronograma.
              </p>
            </div>
          )}
        </div>

        {/* Por status */}
        <div className="glass rounded-2xl p-6">
          <p className="text-[11px] uppercase tracking-widest text-subtle">Demandas</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground">Por status</h2>

          <div className="mt-5 space-y-4">
            {statusBars.map((s) => {
              const total = demands.length || 1
              const pct = Math.round((s.count / total) * 100)
              return (
                <div key={s.key}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs text-muted">{demandStatusLabels[s.key]}</span>
                    <span className="text-sm text-foreground">{s.count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div className={`${s.color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {demands.length === 0 && <p className="text-xs text-subtle">Nenhuma demanda ainda.</p>}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5">
            <div>
              <p className="text-xs text-subtle">Clientes</p>
              <p className="text-xl font-bold text-foreground">{clients.length}</p>
            </div>
            <div>
              <p className="text-xs text-subtle">Recorrência</p>
              <p className="text-xl font-bold text-foreground">
                {clients.length > 0 ? Math.round((clientesRecorrentes / clients.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
