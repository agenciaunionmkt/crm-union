import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { listDemandsByClient } from '../../lib/api/demands'

function formatDate(value) {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

export default function Historico() {
  const { profile } = useAuth()

  const demandsQuery = useQuery({
    queryKey: ['demands', 'client', profile?.cliente_id],
    queryFn: () => listDemandsByClient(profile.cliente_id),
    enabled: !!profile?.cliente_id,
  })

  const delivered = (demandsQuery.data ?? [])
    .filter((d) => d.status === 'entregue')
    .sort((a, b) => (b.prazo ?? '').localeCompare(a.prazo ?? ''))

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Histórico de entregas</h1>
      <p className="mt-1 text-sm text-gray-500">Entregas de meses anteriores</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {demandsQuery.isLoading && <p className="p-6 text-sm text-gray-400">Carregando...</p>}
        {demandsQuery.error && (
          <p className="p-6 text-sm text-red-600">Erro ao carregar histórico: {demandsQuery.error.message}</p>
        )}
        {!demandsQuery.isLoading && delivered.length === 0 && (
          <p className="p-6 text-sm text-gray-400">Nenhuma entrega concluída ainda.</p>
        )}
        {delivered.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Demanda</th>
                <th className="px-4 py-3 font-medium">Tags</th>
                <th className="px-4 py-3 font-medium">Entregue em</th>
              </tr>
            </thead>
            <tbody>
              {delivered.map((demand) => (
                <tr key={demand.id} className="border-b border-gray-100 last:border-0">
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
                  <td className="px-4 py-3 text-gray-600">{formatDate(demand.prazo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
