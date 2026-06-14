import { Fragment, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { listDemandsByClient } from '../../lib/api/demands'
import DemandActivity from '../../components/DemandActivity'

export const demandStatusLabels = {
  a_fazer: 'A fazer',
  em_andamento: 'Em andamento',
  em_revisao: 'Em revisão',
  entregue: 'Entregue',
}

export const demandStatusStyles = {
  a_fazer: 'bg-white/5 text-neutral-300 border border-white/10',
  em_andamento: 'bg-violet-500/15 text-violet-300 border border-violet-500/30',
  em_revisao: 'bg-yellow-400/15 text-yellow-300 border border-yellow-400/30',
  entregue: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
}

function formatDate(value) {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

export default function ClientDemandas() {
  const { profile } = useAuth()
  const [expandedId, setExpandedId] = useState(null)

  const demandsQuery = useQuery({
    queryKey: ['demands', 'client', profile?.cliente_id],
    queryFn: () => listDemandsByClient(profile.cliente_id),
    enabled: !!profile?.cliente_id,
  })

  const demands = demandsQuery.data ?? []

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Status das demandas</h1>
      <p className="mt-1 text-sm text-gray-500">Acompanhe o progresso de cada entrega</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {demandsQuery.isLoading && <p className="p-6 text-sm text-gray-400">Carregando...</p>}
        {demandsQuery.error && (
          <p className="p-6 text-sm text-red-600">Erro ao carregar demandas: {demandsQuery.error.message}</p>
        )}
        {!demandsQuery.isLoading && demands.length === 0 && (
          <p className="p-6 text-sm text-gray-400">Nenhuma demanda registrada ainda.</p>
        )}
        {demands.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Demanda</th>
                <th className="px-4 py-3 font-medium">Tags</th>
                <th className="px-4 py-3 font-medium">Responsável</th>
                <th className="px-4 py-3 font-medium">Prazo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {demands.map((demand) => (
                <Fragment key={demand.id}>
                  <tr className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{demand.titulo}</p>
                      {demand.descricao && (
                        <p className="mt-1 max-w-md text-xs text-gray-500">{demand.descricao}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(demand.tags ?? []).map((tag) => (
                          <span
                            key={tag.id}
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                            style={{ backgroundColor: tag.cor }}
                          >
                            {tag.nome}
                          </span>
                        ))}
                        {(demand.tags ?? []).length === 0 && '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{demand.responsavel?.nome ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(demand.prazo)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${demandStatusStyles[demand.status]}`}
                      >
                        {demandStatusLabels[demand.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expandedId === demand.id ? null : demand.id)}
                        className="text-xs font-medium text-gray-500 hover:text-gray-900"
                      >
                        {expandedId === demand.id ? 'Fechar' : 'Detalhes'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === demand.id && (
                    <tr className="border-b border-gray-100 last:border-0">
                      <td colSpan={6} className="bg-gray-50 px-4 py-4">
                        <DemandActivity demandId={demand.id} mode="cliente" currentUser={profile} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
