import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { createClientRequest, listClientRequestsByClient } from '../../lib/api/requests'

const statusLabels = {
  pendente: 'Pendente',
  em_analise: 'Em análise',
  convertido: 'Convertido em demanda',
  recusado: 'Recusado',
}

const statusStyles = {
  pendente: 'bg-yellow-400/15 text-yellow-300 border border-yellow-400/30',
  em_analise: 'bg-violet-500/15 text-violet-300 border border-violet-500/30',
  convertido: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  recusado: 'bg-white/5 text-neutral-400 border border-white/10',
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR')
}

export default function ClientSolicitacoes() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')

  const requestsQuery = useQuery({
    queryKey: ['client_requests', profile?.cliente_id],
    queryFn: () => listClientRequestsByClient(profile.cliente_id),
    enabled: !!profile?.cliente_id,
  })

  const createMutation = useMutation({
    mutationFn: (payload) => createClientRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client_requests', profile?.cliente_id] })
      setTitulo('')
      setDescricao('')
    },
  })

  function handleSubmit(e) {
    e.preventDefault()
    createMutation.mutate({
      cliente_id: profile.cliente_id,
      criado_por: profile.id,
      titulo,
      descricao,
    })
  }

  const requests = requestsQuery.data ?? []
  const inputClass =
    'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20'

  return (
    <div>
      <h1 className="text-2xl font-normal text-white">Nova solicitação</h1>
      <p className="mt-1 text-sm text-neutral-400">Envie um novo pedido para a agência</p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-xl glass rounded-2xl p-6">
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-normal text-neutral-300">Título</label>
          <input
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className={inputClass}
            placeholder="Ex: Criar post para promoção de fim de semana"
          />
        </div>
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-normal text-neutral-300">Descrição</label>
          <textarea
            rows={3}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className={`${inputClass} resize-none`}
            placeholder="Conte mais detalhes sobre o que você precisa"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-yellow-500 disabled:opacity-60 transition-colors"
          >
            {createMutation.isPending ? 'Enviando...' : 'Enviar solicitação'}
          </button>
          {createMutation.isSuccess && (
            <span className="text-xs text-emerald-400">Solicitação enviada.</span>
          )}
          {createMutation.error && (
            <span className="text-xs text-red-400">{createMutation.error.message}</span>
          )}
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-sm font-normal uppercase tracking-widest text-neutral-400">Suas solicitações</h2>
        <div className="mt-3 glass rounded-2xl overflow-hidden">
          {requestsQuery.isLoading && <p className="p-6 text-sm text-neutral-400">Carregando...</p>}
          {!requestsQuery.isLoading && requests.length === 0 && (
            <p className="p-6 text-sm text-neutral-400">Você ainda não enviou nenhuma solicitação.</p>
          )}
          {requests.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-normal">Solicitação</th>
                  <th className="px-4 py-3 font-normal">Enviado em</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-normal text-white">{request.titulo}</p>
                      {request.descricao && (
                        <p className="mt-1 max-w-md text-xs text-neutral-400">{request.descricao}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-400">{formatDate(request.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-normal ${statusStyles[request.status]}`}>
                        {statusLabels[request.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
