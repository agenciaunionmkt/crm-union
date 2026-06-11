import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { listApprovalsByClient, reviewApproval } from '../../lib/api/requests'

function formatDate(value) {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function ApprovalCard({ approval, onReview, submitting }) {
  const [feedback, setFeedback] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900">{approval.demand?.titulo}</p>
          <p className="mt-1 text-xs text-gray-500">Prazo: {formatDate(approval.demand?.prazo)}</p>
        </div>
      </div>

      {showFeedback && (
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={2}
          placeholder="Descreva o que precisa ser ajustado..."
          className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      )}

      <div className="mt-3 flex gap-2">
        <button
          disabled={submitting}
          onClick={() => onReview(approval.id, 'aprovado', null)}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-brand-600 disabled:opacity-60"
        >
          Aprovar
        </button>
        {!showFeedback ? (
          <button
            onClick={() => setShowFeedback(true)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Pedir revisão
          </button>
        ) : (
          <button
            disabled={submitting || !feedback.trim()}
            onClick={() => onReview(approval.id, 'revisao_solicitada', feedback)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Enviar revisão
          </button>
        )}
      </div>
    </div>
  )
}

export default function Aprovacoes() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const approvalsQuery = useQuery({
    queryKey: ['approvals', profile?.cliente_id],
    queryFn: () => listApprovalsByClient(profile.cliente_id),
    enabled: !!profile?.cliente_id,
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, feedback }) => reviewApproval(id, status, feedback),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approvals', profile?.cliente_id] }),
  })

  const approvals = approvalsQuery.data ?? []
  const pending = approvals.filter((a) => a.status === 'pendente')
  const reviewed = approvals.filter((a) => a.status !== 'pendente')

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Aprovar entregas</h1>
      <p className="mt-1 text-sm text-gray-500">Aprove ou peça revisão dos materiais entregues</p>

      {approvalsQuery.isLoading && <p className="mt-6 text-sm text-gray-400">Carregando...</p>}
      {approvalsQuery.error && (
        <p className="mt-6 text-sm text-red-600">Erro ao carregar aprovações: {approvalsQuery.error.message}</p>
      )}

      {!approvalsQuery.isLoading && (
        <>
          <div className="mt-6 space-y-3">
            {pending.length === 0 && (
              <p className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-400">
                Nenhuma entrega aguardando aprovação no momento.
              </p>
            )}
            {pending.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                submitting={reviewMutation.isPending}
                onReview={(id, status, feedback) => reviewMutation.mutate({ id, status, feedback })}
              />
            ))}
          </div>

          {reviewed.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-gray-700">Histórico de avaliações</h2>
              <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Demanda</th>
                      <th className="px-4 py-3 font-medium">Resultado</th>
                      <th className="px-4 py-3 font-medium">Comentário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewed.map((approval) => (
                      <tr key={approval.id} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-3 font-medium text-gray-900">{approval.demand?.titulo}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              approval.status === 'aprovado'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {approval.status === 'aprovado' ? 'Aprovado' : 'Revisão solicitada'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{approval.feedback || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
