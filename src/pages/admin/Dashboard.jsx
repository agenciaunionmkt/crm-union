import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { Users, Calendar, Zap, RotateCw, TrendingUp, Activity, ArrowUpRight, X } from 'lucide-react'
import { listClients } from '../../lib/api/clients'
import { listDemands } from '../../lib/api/demands'

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [showSettings, setShowSettings] = useState(false)

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

  const metrics = [
    {
      label: 'Clientes ativos',
      value: clients.length,
      icon: Users,
      borderColor: 'border-neutral-700/50'
    },
    {
      label: 'Demandas da semana',
      value: demandasSemana,
      icon: Calendar,
      borderColor: 'border-neutral-700/50'
    },
    {
      label: 'Demandas do dia',
      value: demandasDia,
      icon: Zap,
      borderColor: 'border-neutral-700/50'
    },
    {
      label: 'Demandas atrasadas',
      value: 0,
      icon: RotateCw,
      borderColor: 'border-neutral-700/50'
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
              className={`rounded-2xl border ${metric.borderColor} bg-neutral-900/50 backdrop-blur-xl p-6 hover:border-neutral-600/50 transition-colors`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-neutral-800">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>

              <p className="text-neutral-500 text-xs uppercase tracking-widest mb-2">
                {metric.label}
              </p>
              <p className="text-3xl font-normal text-white">
                {metric.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Overview Card */}
        <div className="lg:col-span-2 border border-neutral-700/50 rounded-2xl bg-neutral-900/50 backdrop-blur-xl p-8 hover:border-neutral-600/50 transition-colors">
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
              <p className="text-xs text-green-400 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> Crescimento
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-neutral-500 text-xs">Demandas ativas</p>
              <p className="text-2xl font-normal text-white">{demands.length}</p>
              <p className="text-xs text-neutral-400">Em andamento</p>
            </div>
            <div className="space-y-2">
              <p className="text-neutral-500 text-xs">Taxa de recorrência</p>
              <p className="text-2xl font-normal text-white">
                {clients.length > 0 ? Math.round((clientesRecorrentes / clients.length) * 100) : 0}%
              </p>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Otimizado
              </p>
            </div>
          </div>
        </div>

        {/* Performance Card */}
        <div className="border border-neutral-700/50 rounded-2xl bg-neutral-900/50 backdrop-blur-xl p-8 hover:border-neutral-600/50 transition-colors">
          <div className="mb-8">
            <p className="text-neutral-400 text-xs uppercase tracking-widest mb-2">Performance</p>
            <h2 className="text-2xl font-normal text-white">Status</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-400">Satisfação</span>
                <span className="text-sm font-normal text-white">100%</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                <div className="bg-green-600 h-full w-full rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-400">Eficiência</span>
                <span className="text-sm font-normal text-white">85%</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-full w-[85%] rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 rounded-2xl border border-neutral-700/50 p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-normal text-white">Configurações</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile Section */}
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-widest text-neutral-400">Perfil</p>

                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full border-2 border-neutral-600 flex items-center justify-center bg-transparent">
                    <Users className="w-10 h-10 text-neutral-400" />
                  </div>
                  <button className="px-4 py-2 bg-transparent border border-neutral-600 text-neutral-300 text-sm rounded-lg hover:bg-neutral-800/50 transition-colors">
                    Adicionar foto
                  </button>
                </div>

                {/* Name Field */}
                <div>
                  <label className="text-xs text-neutral-400 mb-2 block">Nome completo</label>
                  <input
                    type="text"
                    defaultValue={profile?.nome ?? 'Usuário'}
                    className="w-full bg-transparent border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neutral-600"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="text-xs text-neutral-400 mb-2 block">Email</label>
                  <input
                    type="email"
                    defaultValue={profile?.email ?? 'email@example.com'}
                    className="w-full bg-transparent border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neutral-600"
                  />
                </div>

                {/* Role Field */}
                <div>
                  <label className="text-xs text-neutral-400 mb-2 block">Função</label>
                  <input
                    type="text"
                    defaultValue={profile?.papel ?? 'gestor'}
                    className="w-full bg-transparent border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neutral-600"
                    disabled
                  />
                </div>

                {/* Password Section */}
                <div className="pt-4 border-t border-neutral-700">
                  <p className="text-xs uppercase tracking-widest text-neutral-400 mb-4">Segurança</p>

                  <div>
                    <label className="text-xs text-neutral-400 mb-2 block">Nova senha</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-transparent border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neutral-600"
                    />
                  </div>

                  <div className="mt-3">
                    <label className="text-xs text-neutral-400 mb-2 block">Confirmar senha</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-transparent border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neutral-600"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 bg-transparent border border-neutral-600 text-neutral-300 text-sm rounded-lg hover:bg-neutral-800/50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
