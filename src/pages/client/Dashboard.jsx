import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { listDemandsByClient } from '../../lib/api/demands'
import DemandCalendar from '../../components/DemandCalendar'

export default function ClientDashboard() {
  const { profile } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const demandsQuery = useQuery({
    queryKey: ['demands', 'client', profile?.cliente_id],
    queryFn: () => listDemandsByClient(profile.cliente_id),
    enabled: !!profile?.cliente_id,
  })

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">
        Olá, {profile?.nome ?? 'bem-vindo(a)'}
      </h1>
      <p className="mt-1 text-sm text-gray-500">Cronograma do mês</p>

      <div className="mt-6">
        {demandsQuery.isLoading && <p className="text-sm text-gray-400">Carregando...</p>}
        {demandsQuery.error && (
          <p className="text-sm text-red-600">Erro ao carregar cronograma: {demandsQuery.error.message}</p>
        )}
        {!demandsQuery.isLoading && !demandsQuery.error && (
          <DemandCalendar
            demands={demandsQuery.data ?? []}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        )}
      </div>
    </div>
  )
}
