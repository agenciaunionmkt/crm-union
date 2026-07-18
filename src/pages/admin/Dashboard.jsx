import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Users, ListTodo, Clock, AlertTriangle, CheckCircle2, ArrowRight,
  CalendarDays, Wallet, Inbox, Video,
} from 'lucide-react'
import { listClients } from '../../lib/api/clients'
import { listDemands } from '../../lib/api/demands'
import { listFinancialEntries } from '../../lib/api/financial'
import { listClientRequests } from '../../lib/api/requests'
import { listReunioes } from '../../lib/api/reunioes'
import { demandStatusLabels, demandStatusStyles } from '../../lib/status'

const FEITAS = ['entregue', 'aprovado', 'concluido']
const PENDENTES = ['a_fazer', 'em_andamento']

function formatBRL(value) {
  return (value ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Dias de atraso entre o prazo (YYYY-MM-DD) e hoje
function diasAtraso(prazo, hojeStr) {
  const [y1, m1, d1] = prazo.split('-').map(Number)
  const [y2, m2, d2] = hojeStr.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000)
}

function formatDiaMes(value) {
  const [, m, d] = value.split('-')
  return `${d}/${m}`
}

export default function AdminDashboard() {
  const { profile } = useAuth()

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: listClients })
  const { data: demands = [] } = useQuery({ queryKey: ['demands'], queryFn: listDemands })
  const { data: entries = [] } = useQuery({ queryKey: ['financial-all'], queryFn: () => listFinancialEntries() })
  const { data: requests = [] } = useQuery({ queryKey: ['client-requests'], queryFn: listClientRequests })
  const { data: reunioes = [] } = useQuery({ queryKey: ['reunioes'], queryFn: listReunioes })

  const hojeStr = new Date().toISOString().split('T')[0]
  const anoMes = hojeStr.slice(0, 7)
  const nomeCliente = (id) => clients.find((c) => c.id === id)?.nome ?? '—'

  // Hoje
  const demandasHoje = demands.filter((d) => d.prazo === hojeStr)
  const pendentesHoje = demandasHoje.filter((d) => PENDENTES.includes(d.status))
  const feitasHoje = demandasHoje.filter((d) => FEITAS.includes(d.status))
  const progressoHoje = demandasHoje.length
    ? Math.round((feitasHoje.length / demandasHoje.length) * 100)
    : 0

  const aguardandoAprovacao = demands.filter((d) => d.status === 'entregue').length
  const atrasadas = demands
    .filter((d) => d.prazo && d.prazo < hojeStr && !FEITAS.includes(d.status))
    .sort((a, b) => a.prazo.localeCompare(b.prazo))

  // Próximos 7 dias (sem contar hoje)
  const seteDias = new Date()
  seteDias.setDate(seteDias.getDate() + 7)
  const seteDiasStr = seteDias.toISOString().split('T')[0]
  const proximas = demands
    .filter((d) => d.prazo && d.prazo > hojeStr && d.prazo <= seteDiasStr && !FEITAS.includes(d.status))
    .sort((a, b) => a.prazo.localeCompare(b.prazo))

  const clientesRecorrentes = clients.filter((c) => c.tipo_cliente === 'recorrente').length

  // Pulso financeiro do mês
  const doMes = entries.filter((e) => e.vencimento?.startsWith(anoMes))
  const recebidoMes = doMes.filter((e) => e.tipo === 'entrada' && e.status === 'pago').reduce((s, e) => s + (e.valor || 0), 0)
  const aReceberMes = doMes.filter((e) => e.tipo === 'entrada' && e.status !== 'pago').reduce((s, e) => s + (e.valor || 0), 0)
  const mensalidadesMes = doMes.filter((e) => e.tipo === 'entrada' && e.recorrente && e.cliente_id)
  const mensalidadesPagas = mensalidadesMes.filter((e) => e.status === 'pago').length

  // Solicitações abertas e reuniões de hoje
  const solicitacoesAbertas = requests.filter((r) => r.status === 'pendente' || r.status === 'em_analise').length
  const reunioesHoje = reunioes.filter((r) => r.inicio?.startsWith(hojeStr))

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
      tone: 'text-accent',
      bg: 'bg-accent/10',
      to: '/admin/demandas',
    },
    {
      label: 'Aguardando aprovação',
      value: aguardandoAprovacao,
      hint: 'do cliente',
      icon: Clock,
      tone: 'text-blue-300',
      bg: 'bg-blue-500/10',
      to: '/admin/demandas',
    },
    {
      label: 'Atrasadas',
      value: atrasadas.length,
      hint: 'prazo vencido',
      icon: AlertTriangle,
      tone: 'text-danger',
      bg: 'bg-danger/10',
      to: '/admin/demandas',
    },
    {
      label: 'Clientes ativos',
      value: clients.length,
      hint: `${clientesRecorrentes} recorrentes`,
      icon: Users,
      tone: 'text-foreground',
      bg: 'bg-white/5',
      to: '/admin/clientes',
    },
  ]

  // Card de demanda clicável: abre o modal direto na página de demandas
  const DemandaLink = ({ d, children }) => (
    <Link
      to="/admin/demandas"
      state={{ openDemandId: d.id }}
      className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-accent/40 hover:bg-white/5"
    >
      {children}
    </Link>
  )

  return (
    <div className="space-y-6">
      <div className="pt-2">
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          Bem-vindo, {profile?.nome ?? 'usuário'}
        </h1>
        <p className="mt-1 text-sm text-muted">Visão geral da agência e do dia</p>
      </div>

      {/* Métricas (clicáveis) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <Link
              key={m.label}
              to={m.to}
              className="glass rounded-2xl p-5 transition-colors hover:bg-white/5"
            >
              <div className={`mb-3 inline-flex rounded-lg p-2 ${m.bg}`}>
                <Icon className={`h-5 w-5 ${m.tone}`} />
              </div>
              <p className="text-[11px] uppercase tracking-widest text-subtle">{m.label}</p>
              <p className={`mt-1 text-3xl font-black tracking-tight ${m.tone}`}>{m.value}</p>
              {m.hint && <p className="mt-1 text-xs text-muted">{m.hint}</p>}
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="space-y-6 lg:col-span-2">
          {/* Foco do dia */}
          <div className="glass rounded-2xl p-6">
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
                  <DemandaLink key={d.id} d={d}>
                    <span className={`h-2 w-2 flex-shrink-0 rounded-full ${feita ? 'bg-emerald-400' : 'bg-accent'}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm ${feita ? 'text-muted line-through' : 'text-foreground'}`}>
                        {d.titulo}
                      </p>
                      <p className="text-xs text-subtle">{nomeCliente(d.cliente_id)}</p>
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${demandStatusStyles[d.status] ?? ''}`}>
                      {demandStatusLabels[d.status] ?? d.status}
                    </span>
                  </DemandaLink>
                )
              })}
            </div>

            {/* Atrasadas: lista nominal, clique abre a demanda */}
            {atrasadas.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-danger">
                  <AlertTriangle className="h-3.5 w-3.5" /> Atrasadas ({atrasadas.length})
                </p>
                <div className="space-y-2">
                  {atrasadas.map((d) => {
                    const dias = diasAtraso(d.prazo, hojeStr)
                    return (
                      <Link
                        key={d.id}
                        to="/admin/demandas"
                        state={{ openDemandId: d.id }}
                        className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 transition-colors hover:border-danger/60 hover:bg-danger/10"
                      >
                        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-danger" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-foreground">{d.titulo}</p>
                          <p className="text-xs text-subtle">{nomeCliente(d.cliente_id)}</p>
                        </div>
                        <span className="flex-shrink-0 text-xs font-medium text-danger">
                          {dias === 1 ? '1 dia' : `${dias} dias`} de atraso
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Próximos 7 dias */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted" />
              <h2 className="text-sm font-bold tracking-tight text-foreground">Próximos 7 dias</h2>
              <span className="text-xs text-muted">{proximas.length} demanda(s)</span>
            </div>
            <div className="mt-4 space-y-2">
              {proximas.length === 0 && (
                <p className="text-sm text-muted">Nenhum prazo na próxima semana.</p>
              )}
              {proximas.slice(0, 6).map((d) => (
                <DemandaLink key={d.id} d={d}>
                  <span className="w-12 flex-shrink-0 text-xs font-medium text-muted">{formatDiaMes(d.prazo)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{d.titulo}</p>
                    <p className="text-xs text-subtle">{nomeCliente(d.cliente_id)}</p>
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${demandStatusStyles[d.status] ?? ''}`}>
                    {demandStatusLabels[d.status] ?? d.status}
                  </span>
                </DemandaLink>
              ))}
              {proximas.length > 6 && (
                <Link to="/admin/demandas" className="block pt-1 text-xs text-muted hover:text-foreground transition-colors">
                  + {proximas.length - 6} outras no cronograma
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-6">
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
          </div>

          {/* Pulso do mês */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted" />
                <h2 className="text-sm font-bold tracking-tight text-foreground">Pulso do mês</h2>
              </div>
              <Link
                to="/admin/financeiro"
                className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
              >
                Financeiro <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Recebido</span>
                <span className="text-sm font-semibold text-emerald-400">R$ {formatBRL(recebidoMes)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">A receber</span>
                <span className="text-sm font-semibold text-orange-400">R$ {formatBRL(aReceberMes)}</span>
              </div>
              {mensalidadesMes.length > 0 && (
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted">Mensalidades pagas</span>
                  <span className="text-sm font-semibold text-foreground">
                    {mensalidadesPagas}/{mensalidadesMes.length}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Radar: solicitações + reuniões */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <Link
              to="/admin/solicitacoes"
              className="flex items-center justify-between transition-colors hover:opacity-80"
            >
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-muted" />
                <span className="text-sm text-foreground">Solicitações abertas</span>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${solicitacoesAbertas > 0 ? 'bg-accent/15 text-accent' : 'bg-white/5 text-muted'}`}>
                {solicitacoesAbertas}
              </span>
            </Link>

            <Link
              to="/admin/reunioes"
              className="flex items-center justify-between border-t border-border pt-4 transition-colors hover:opacity-80"
            >
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-muted" />
                <span className="text-sm text-foreground">Reuniões hoje</span>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${reunioesHoje.length > 0 ? 'bg-blue-500/15 text-blue-300' : 'bg-white/5 text-muted'}`}>
                {reunioesHoje.length}
              </span>
            </Link>
            {reunioesHoje.length > 0 && (
              <div className="space-y-1.5">
                {reunioesHoje.map((r) => (
                  <p key={r.id} className="truncate text-xs text-subtle">
                    {r.inicio?.slice(11, 16)} — {r.titulo ?? r.client?.nome ?? 'Reunião'}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
