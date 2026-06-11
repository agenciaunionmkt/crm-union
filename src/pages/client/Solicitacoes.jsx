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
  pendente: 'bg-yellow-100 text-yellow-700',
  em_analise: 'bg-blue-100 text-blue-700',
  convertido: 'bg-green-100 text-green-700',
  recusado: 'bg-gray-100 text-gray-500',
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

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Nova solicitação</h1>
      <p className="mt-1 text-sm text-gray-500">Envie um novo pedido para a agência</p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 max-w-xl rounded-xl border border-gray-200 bg-white p-5"
      >
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Título</label>
          <input
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            placeholder="Ex: Criar post para promoção de fim de semana"
          />
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
          <textarea
            rows={3}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            placeholder="Conte mais detalhes sobre o que você precisa"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-brand-600 disabled:opacity-60"
          >
            {createMutation.isPending ? 'Enviando...' : 'Enviar solicitação'}
          </button>
          {createMutation.isSuccess && (
            <span className="text-xs text-green-600">Solicitação enviada.</span>
          )}
          {createMutation.error && (
            <span className="text-xs text-red-600">{createMutation.error.message}</span>
          )}
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-700">Suas solicitações</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {requestsQuery.isLoading && <p className="p-6 text-sm text-gray-400">Carregando...</p>}
          {!requestsQuery.isLoading && requests.length === 0 && (
            <p className="p-6 text-sm text-gray-400">Você ainda não enviou nenhuma solicitação.</p>
          )}
          {requests.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Solicitação</th>
                  <th className="px-4 py-3 font-medium">Enviado em</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{request.titulo}</p>
                      {request.descricao && (
                        <p className="mt-1 max-w-md text-xs text-gray-500">{request.descricao}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(request.created_at)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[request.status]}`}
                      >
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
