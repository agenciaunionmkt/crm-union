import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { listApprovalsByClient, reviewApproval } from '../../lib/api/requests'
import { demandStatusLabels, demandStatusStyles } from './Demandas'

function formatDate(value) {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function ApprovalCard({ approval, onReview, submitting }) {
  const [feedback, setFeedback] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-normal text-white">{approval.demand?.titulo}</p>
          <p className="mt-1 text-xs text-neutral-400">Prazo: {formatDate(approval.demand?.prazo)}</p>
        </div>
        {approval.demand?.status && (
          <span className={`inline-flex flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-normal ${demandStatusStyles[approval.demand.status]}`}>
            {demandStatusLabels[approval.demand.status]}
          </span>
        )}
      </div>

      {showFeedback && (
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={2}
          placeholder="Descreva o que precisa ser ajustado..."
          className="mt-3 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 resize-none"
        />
      )}

      <div className="mt-4 flex gap-2">
        <button
          disabled={submitting}
          onClick={() => onReview(approval.id, 'aprovado', null)}
          className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-500 disabled:opacity-60 transition-colors"
        >
          Aprovar
        </button>
        {!showFeedback ? (
          <button
            onClick={() => setShowFeedback(true)}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-normal text-neutral-300 hover:bg-white/5 transition-colors"
          >
            Pedir revisão
          </button>
        ) : (
          <button
            disabled={submitting || !feedback.trim()}
            onClick={() => onReview(approval.id, 'revisao_solicitada', feedback)}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-normal text-neutral-300 hover:bg-white/5 disabled:opacity-60 transition-colors"
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
    refetchInterval: 10000,
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
      <h1 className="text-2xl font-normal text-white">Aprovar entregas</h1>
      <p className="mt-1 text-sm text-neutral-400">Aprove ou peça revisão dos materiais entregues</p>

      {approvalsQuery.isLoading && <p className="mt-6 text-sm text-neutral-400">Carregando...</p>}
      {approvalsQuery.error && (
        <p className="mt-6 text-sm text-red-400">Erro ao carregar aprovações: {approvalsQuery.error.message}</p>
      )}

      {!approvalsQuery.isLoading && (
        <>
          <div className="mt-6 space-y-3">
            {pending.length === 0 && (
              <p className="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-neutral-400">
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
              <h2 className="text-sm font-normal uppercase tracking-widest text-neutral-400">Histórico de avaliações</h2>
              <div className="mt-3 glass rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-neutral-400">
                    <tr>
                      <th className="px-4 py-3 font-normal">Demanda</th>
                      <th className="px-4 py-3 font-normal">Resultado</th>
                      <th className="px-4 py-3 font-normal">Comentário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewed.map((approval) => (
                      <tr key={approval.id} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-3 font-normal text-white">{approval.demand?.titulo}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-normal ${
                              approval.status === 'aprovado'
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'bg-yellow-400/15 text-yellow-300 border border-yellow-400/30'
                            }`}
                          >
                            {approval.status === 'aprovado' ? 'Aprovado' : 'Revisão solicitada'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-400">{approval.feedback || '—'}</td>
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
