import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { Users, Calendar, Zap, RotateCw, Activity } from 'lucide-react'
import { listClients } from '../../lib/api/clients'
import { listDemands } from '../../lib/api/demands'

export default function AdminDashboard() {
  const { profile } = useAuth()

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: listClients,
  })

  const { data: demands = [] } = useQuery({
    queryKey: ['demands'],
    queryFn: listDemands,
  })

  // Calcular demandas da semana
  const hoje = new Date()
  const demandasSemana = demands.filter(d => {
    const dataD = new Date(d.prazo)
    const diasDif = Math.ceil((dataD - hoje) / (1000 * 60 * 60 * 24))
    return diasDif <= 7 && diasDif >= 0
  }).length

  // Calcular demandas do dia
  const demandasDia = demands.filter(d => {
    const dataD = new Date(d.prazo)
    const dataStr = dataD.toISOString().split('T')[0]
    const hojeStr = hoje.toISOString().split('T')[0]
    return dataStr === hojeStr
  }).length

  const clientesRecorrentes = clients.filter(c => c.tipo_cliente === 'recorrente').length

  // Demandas atrasadas: têm prazo definido, o prazo já passou e ainda não foram
  // concluídas (entregue/aprovado/concluído contam como feitas).
  const hojeStr = hoje.toISOString().split('T')[0]
  const FEITAS = ['entregue', 'aprovado', 'concluido']
  const demandasAtrasadas = demands.filter(
    (d) => d.prazo && d.prazo < hojeStr && !FEITAS.includes(d.status)
  ).length

  // Contagem por status (dados reais)
  const statusCount = { a_fazer: 0, em_andamento: 0, em_revisao: 0, entregue: 0 }
  demands.forEach((d) => {
    if (statusCount[d.status] !== undefined) statusCount[d.status] += 1
  })
  const demandasAtivas = demands.filter((d) => d.status !== 'entregue').length
  const statusBars = [
    { key: 'a_fazer', label: 'A fazer', count: statusCount.a_fazer, color: 'bg-neutral-400' },
    { key: 'em_andamento', label: 'Em andamento', count: statusCount.em_andamento, color: 'bg-violet-500' },
    { key: 'em_revisao', label: 'Em revisão', count: statusCount.em_revisao, color: 'bg-yellow-400' },
    { key: 'entregue', label: 'Entregue', count: statusCount.entregue, color: 'bg-emerald-500' },
  ]

  const metrics = [
    {
      label: 'Clientes ativos',
      value: clients.length,
      icon: Users,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
      valueColor: 'text-blue-400',
    },
    {
      label: 'Demandas da semana',
      value: demandasSemana,
      icon: Calendar,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      valueColor: 'text-emerald-400',
    },
    {
      label: 'Demandas do dia',
      value: demandasDia,
      icon: Zap,
      iconColor: 'text-orange-400',
      iconBg: 'bg-orange-500/10',
      valueColor: 'text-orange-400',
    },
    {
      label: 'Demandas atrasadas',
      value: demandasAtrasadas,
      icon: RotateCw,
      iconColor: 'text-red-400',
      iconBg: 'bg-red-500/10',
      valueColor: 'text-red-400',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-3xl font-normal text-white mb-2">
          Bem-vindo, {profile?.nome ?? 'usuário'}
        </h1>
        <p className="text-neutral-400 text-sm">
          Visão geral da agência e métricas principais
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <div
              key={metric.label}
              className="glass glass-hover rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${metric.iconBg}`}>
                  <Icon className={`w-5 h-5 ${metric.iconColor}`} />
                </div>
              </div>

              <p className="text-neutral-500 text-xs uppercase tracking-widest mb-2">
                {metric.label}
              </p>
              <p className={`text-3xl font-normal ${metric.valueColor}`}>
                {metric.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Overview Card */}
        <div className="glass glass-hover lg:col-span-2 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-neutral-400 text-xs uppercase tracking-widest mb-2">Overview</p>
              <h2 className="text-2xl font-normal text-white">Métricas principais</h2>
            </div>
            <Activity className="w-6 h-6 text-neutral-400" />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-neutral-500 text-xs">Total de clientes</p>
              <p className="text-2xl font-normal text-white">{clients.length}</p>
              <p className="text-xs text-neutral-400">{clientesRecorrentes} recorrentes</p>
            </div>
            <div className="space-y-2">
              <p className="text-neutral-500 text-xs">Demandas ativas</p>
              <p className="text-2xl font-normal text-white">{demandasAtivas}</p>
              <p className="text-xs text-neutral-400">{statusCount.entregue} entregues</p>
            </div>
            <div className="space-y-2">
              <p className="text-neutral-500 text-xs">Taxa de recorrência</p>
              <p className="text-2xl font-normal text-white">
                {clients.length > 0 ? Math.round((clientesRecorrentes / clients.length) * 100) : 0}%
              </p>
              <p className="text-xs text-neutral-400">dos clientes</p>
            </div>
          </div>
        </div>

        {/* Status das demandas (dados reais) */}
        <div className="glass glass-hover rounded-2xl p-8">
          <div className="mb-8">
            <p className="text-neutral-400 text-xs uppercase tracking-widest mb-2">Demandas</p>
            <h2 className="text-2xl font-normal text-white">Por status</h2>
          </div>

          <div className="space-y-4">
            {statusBars.map((s) => {
              const total = demands.length || 1
              const pct = Math.round((s.count / total) * 100)
              return (
                <div key={s.key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-neutral-400">{s.label}</span>
                    <span className="text-sm font-normal text-white">{s.count}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                    <div className={`${s.color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {demands.length === 0 && (
              <p className="text-xs text-neutral-500">Nenhuma demanda ainda.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
