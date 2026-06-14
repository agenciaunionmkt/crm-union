import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { listDemandsByClient } from '../../lib/api/demands'
import DemandCalendar from '../../components/DemandCalendar'
import Modal from '../../components/Modal'
import { demandStatusLabels, demandStatusStyles } from './Demandas'

function formatDate(value) {
  if (!value) return '—'
  const [y, m, d] = value.split('-')
  return `${d}/${m}/${y}`
}

export default function ClientCalendario() {
  const { profile } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [detalhe, setDetalhe] = useState(null)

  const { data: demands = [], isLoading } = useQuery({
    queryKey: ['client-demands', profile?.cliente_id],
    queryFn: () => listDemandsByClient(profile.cliente_id),
    enabled: !!profile?.cliente_id,
  })

  return (
    <div>
      <h1 className="text-2xl font-normal text-white">Calendário de conteúdo</h1>
      <p className="mt-1 text-sm text-neutral-400">Planejamento de publicações do mês</p>

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-neutral-400">Carregando...</p>
        ) : (
          <DemandCalendar
            demands={demands}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onCardClick={(d) => setDetalhe(d)}
          />
        )}
      </div>

      <Modal open={!!detalhe} title="Detalhes do conteúdo" onClose={() => setDetalhe(null)}>
        {detalhe && (
          <div className="space-y-4">
            <div>
              <p className="text-lg font-normal text-white">{detalhe.titulo}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                {detalhe.status && (
                  <span className={`inline-flex rounded-full px-2.5 py-1 ${demandStatusStyles[detalhe.status]}`}>
                    {demandStatusLabels[detalhe.status]}
                  </span>
                )}
                <span>Data: {formatDate(detalhe.prazo)}</span>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-neutral-500">Descrição</p>
              <p className="whitespace-pre-wrap text-sm text-neutral-200">
                {detalhe.descricao || 'Sem descrição.'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
