import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listClients } from '../../lib/api/clients'
import { listTeamUsers } from '../../lib/api/users'
import { createDemand, listTags } from '../../lib/api/demands'
import { listClientRequests, updateClientRequestStatus } from '../../lib/api/requests'
import Modal from '../../components/Modal'
import DemandForm from '../../components/DemandForm'

const statusLabels = {
  pendente: 'Pendente',
  em_analise: 'Em análise',
  convertido: 'Convertido',
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

export default function Solicitacoes() {
  const queryClient = useQueryClient()
  const [convertingRequest, setConvertingRequest] = useState(null)

  const requestsQuery = useQuery({ queryKey: ['client_requests'], queryFn: listClientRequests })
  const clientsQuery = useQuery({ queryKey: ['clients'], queryFn: listClients })
  const teamQuery = useQuery({ queryKey: ['team-users'], queryFn: listTeamUsers })
  const tagsQuery = useQuery({ queryKey: ['tags'], queryFn: listTags })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateClientRequestStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client_requests'] }),
  })

  const convertMutation = useMutation({
    mutationFn: async ({ values, tagIds, requestId }) => {
      const demand = await createDemand(values, tagIds)
      await updateClientRequestStatus(requestId, 'convertido', demand.id)
      return demand
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client_requests'] })
      queryClient.invalidateQueries({ queryKey: ['demands'] })
      setConvertingRequest(null)
    },
  })

  function handleRecusar(request) {
    if (window.confirm(`Recusar a solicitação "${request.titulo}"?`)) {
      statusMutation.mutate({ id: request.id, status: 'recusado' })
    }
  }

  function handleEmAnalise(request) {
    statusMutation.mutate({ id: request.id, status: 'em_analise' })
  }

  const requests = requestsQuery.data ?? []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-normal text-neutral-900 dark:text-white">Solicitações</h1>
        <p className="mt-1 text-xs text-neutral-700 dark:text-neutral-400">
          Fila de pedidos enviados pelos clientes — triagem e organização em demandas
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-neutral-300 dark:border-neutral-700/50 bg-neutral-50 dark:bg-neutral-900/40 backdrop-blur-xl shadow-lg">
        {requestsQuery.isLoading && <p className="p-6 text-sm text-neutral-500">Carregando...</p>}
        {requestsQuery.error && (
          <p className="p-6 text-sm text-red-600">
            Erro ao carregar solicitações: {requestsQuery.error.message}
          </p>
        )}
        {!requestsQuery.isLoading && requests.length === 0 && (
          <p className="p-6 text-sm text-neutral-500">Nenhuma solicitação enviada ainda.</p>
        )}
        {requests.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-300 bg-neutral-100 text-xs uppercase text-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Solicitação</th>
                <th className="px-4 py-3 font-medium">Enviado em</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-b border-gray-100 align-top last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {request.client?.nome ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <p className="font-medium text-gray-800">{request.titulo}</p>
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
                  <td className="px-4 py-3 text-right">
                    {(request.status === 'pendente' || request.status === 'em_analise') && (
                      <div className="flex justify-end gap-3">
                        {request.status === 'pendente' && (
                          <button
                            onClick={() => handleEmAnalise(request)}
                            className="text-xs font-medium text-gray-600 hover:text-gray-900"
                          >
                            Em análise
                          </button>
                        )}
                        <button
                          onClick={() => setConvertingRequest(request)}
                          className="text-xs font-medium text-gray-900 hover:underline"
                        >
                          Converter em demanda
                        </button>
                        <button
                          onClick={() => handleRecusar(request)}
                          className="text-xs font-medium text-red-500 hover:text-red-700"
                        >
                          Recusar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={!!convertingRequest}
        title="Converter em demanda"
        onClose={() => setConvertingRequest(null)}
        maxWidth="max-w-2xl"
      >
        {convertingRequest && (
          <DemandForm
            initialValues={{
              cliente_id: convertingRequest.cliente_id,
              titulo: convertingRequest.titulo,
              descricao: convertingRequest.descricao ?? '',
              status: 'a_fazer',
            }}
            clients={clientsQuery.data}
            teamUsers={teamQuery.data}
            tags={tagsQuery.data}
            submitting={convertMutation.isPending}
            onCancel={() => setConvertingRequest(null)}
            onSubmit={(values, tagIds) =>
              convertMutation.mutate({ values, tagIds, requestId: convertingRequest.id })
            }
          />
        )}
        {convertMutation.error && (
          <p className="mt-3 text-sm text-red-600">{convertMutation.error.message}</p>
        )}
      </Modal>
    </div>
  )
}
