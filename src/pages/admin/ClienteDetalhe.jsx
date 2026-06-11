import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import {
  deletePlan,
  createPlan,
  getBriefing,
  getClient,
  listPlans,
  updateClient,
  updatePlan,
  upsertBriefing,
} from '../../lib/api/clients'
import Modal from '../../components/Modal'
import ClientForm from '../../components/ClientForm'
import PlanForm from '../../components/PlanForm'
import ChatWindow from '../../components/ChatWindow'

const statusLabels = {
  ativo: 'Ativo',
  pausado: 'Pausado',
  encerrado: 'Encerrado',
}

const statusStyles = {
  ativo: 'bg-green-100 text-green-700',
  pausado: 'bg-yellow-100 text-yellow-700',
  encerrado: 'bg-gray-100 text-gray-600',
}

function formatCurrency(value) {
  if (value === null || value === undefined) return '—'
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(value) {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

export default function ClienteDetalhe() {
  const { id } = useParams()
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const [showEditClient, setShowEditClient] = useState(false)
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [briefingForm, setBriefingForm] = useState({
    tom_de_voz: '',
    referencias: '',
    regras_marca: '',
  })

  const clientQuery = useQuery({
    queryKey: ['clients', id],
    queryFn: () => getClient(id),
  })

  const briefingQuery = useQuery({
    queryKey: ['briefings', id],
    queryFn: () => getBriefing(id),
  })

  const plansQuery = useQuery({
    queryKey: ['plans', id],
    queryFn: () => listPlans(id),
  })

  useEffect(() => {
    if (briefingQuery.data) {
      setBriefingForm({
        tom_de_voz: briefingQuery.data.tom_de_voz ?? '',
        referencias: briefingQuery.data.referencias ?? '',
        regras_marca: briefingQuery.data.regras_marca ?? '',
      })
    }
  }, [briefingQuery.data])

  const updateClientMutation = useMutation({
    mutationFn: (payload) => updateClient(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setShowEditClient(false)
    },
  })

  const briefingMutation = useMutation({
    mutationFn: (payload) => upsertBriefing(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['briefings', id] }),
  })

  const planMutation = useMutation({
    mutationFn: ({ planId, payload }) =>
      planId ? updatePlan(planId, payload) : createPlan(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans', id] })
      setShowPlanForm(false)
      setEditingPlan(null)
    },
  })

  const deletePlanMutation = useMutation({
    mutationFn: deletePlan,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans', id] }),
  })

  function handleBriefingSubmit(e) {
    e.preventDefault()
    briefingMutation.mutate(briefingForm)
  }

  function handleDeletePlan(plan) {
    if (window.confirm(`Remover o plano "${plan.pacote}"?`)) {
      deletePlanMutation.mutate(plan.id)
    }
  }

  if (clientQuery.isLoading) {
    return <p className="text-sm text-gray-400">Carregando...</p>
  }

  if (clientQuery.error) {
    return (
      <p className="text-sm text-red-600">
        Erro ao carregar cliente: {clientQuery.error.message}
      </p>
    )
  }

  const client = clientQuery.data

  return (
    <div>
      <Link to="/admin/clientes" className="text-sm text-gray-500 hover:text-gray-900">
        ← Voltar para clientes
      </Link>

      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{client.nome}</h1>
          <p className="mt-1 text-sm text-gray-500">{client.segmento || 'Sem segmento definido'}</p>
        </div>
        <button
          onClick={() => setShowEditClient(true)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Editar dados
        </button>
      </div>

      <div className="mt-2 flex gap-4 text-sm text-gray-600">
        <span>{client.contato_email || 'sem e-mail'}</span>
        <span>{client.contato_telefone || 'sem telefone'}</span>
      </div>

      {/* Briefing */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">Briefing</h2>
        <p className="mt-1 text-xs text-gray-500">
          Tom de voz, referências e regras de marca usadas pelo time na criação de conteúdo
        </p>

        <form onSubmit={handleBriefingSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tom de voz</label>
            <textarea
              rows={2}
              value={briefingForm.tom_de_voz}
              onChange={(e) =>
                setBriefingForm((prev) => ({ ...prev, tom_de_voz: e.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder="Ex: Descontraído, próximo, sem gírias..."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Referências</label>
            <textarea
              rows={2}
              value={briefingForm.referencias}
              onChange={(e) =>
                setBriefingForm((prev) => ({ ...prev, referencias: e.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder="Links, perfis e materiais de referência"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Regras de marca</label>
            <textarea
              rows={2}
              value={briefingForm.regras_marca}
              onChange={(e) =>
                setBriefingForm((prev) => ({ ...prev, regras_marca: e.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder="Cores, logotipo, palavras proibidas..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={briefingMutation.isPending}
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-brand-600 disabled:opacity-60"
            >
              {briefingMutation.isPending ? 'Salvando...' : 'Salvar briefing'}
            </button>
            {briefingMutation.isSuccess && (
              <span className="text-xs text-green-600">Briefing salvo.</span>
            )}
            {briefingMutation.error && (
              <span className="text-xs text-red-600">{briefingMutation.error.message}</span>
            )}
          </div>
        </form>
      </div>

      {/* Planos */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Plano contratado</h2>
            <p className="mt-1 text-xs text-gray-500">Histórico de pacotes contratados pelo cliente</p>
          </div>
          <button
            onClick={() => {
              setEditingPlan(null)
              setShowPlanForm(true)
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + Novo plano
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
          {plansQuery.isLoading && <p className="p-4 text-sm text-gray-400">Carregando...</p>}
          {!plansQuery.isLoading && (plansQuery.data ?? []).length === 0 && (
            <p className="p-4 text-sm text-gray-400">Nenhum plano cadastrado.</p>
          )}
          {(plansQuery.data ?? []).length > 0 && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Pacote</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Período</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {plansQuery.data.map((plan) => (
                  <tr key={plan.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-900">{plan.pacote}</td>
                    <td className="px-4 py-3 text-gray-600">{formatCurrency(plan.valor)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(plan.inicio)} – {formatDate(plan.fim)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[plan.status]}`}
                      >
                        {statusLabels[plan.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setEditingPlan(plan)
                          setShowPlanForm(true)
                        }}
                        className="mr-3 text-xs font-medium text-gray-600 hover:text-gray-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan)}
                        className="text-xs font-medium text-red-500 hover:text-red-700"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Chat com o cliente */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">Chat com o cliente</h2>
        <p className="mt-1 text-xs text-gray-500">Converse diretamente com o cliente sobre demandas e dúvidas</p>
        <div className="mt-4 h-80">
          <ChatWindow clienteId={id} currentUser={profile} />
        </div>
      </div>

      {/* Modal: editar dados do cliente */}
      <Modal open={showEditClient} title="Editar cliente" onClose={() => setShowEditClient(false)}>
        <ClientForm
          initialValues={client}
          submitting={updateClientMutation.isPending}
          onCancel={() => setShowEditClient(false)}
          onSubmit={(values) => updateClientMutation.mutate(values)}
        />
        {updateClientMutation.error && (
          <p className="mt-3 text-sm text-red-600">{updateClientMutation.error.message}</p>
        )}
      </Modal>

      {/* Modal: criar/editar plano */}
      <Modal
        open={showPlanForm}
        title={editingPlan ? 'Editar plano' : 'Novo plano'}
        onClose={() => {
          setShowPlanForm(false)
          setEditingPlan(null)
        }}
      >
        <PlanForm
          initialValues={editingPlan}
          submitting={planMutation.isPending}
          onCancel={() => {
            setShowPlanForm(false)
            setEditingPlan(null)
          }}
          onSubmit={(values) =>
            planMutation.mutate({ planId: editingPlan?.id ?? null, payload: values })
          }
        />
        {planMutation.error && (
          <p className="mt-3 text-sm text-red-600">{planMutation.error.message}</p>
        )}
      </Modal>
    </div>
  )
}
