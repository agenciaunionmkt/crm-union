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
  ativo: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  pausado: 'bg-yellow-400/15 text-yellow-300 border border-yellow-400/30',
  encerrado: 'bg-white/5 text-neutral-400 border border-white/10',
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

  const [briefingIA, setBriefingIA] = useState(false)

  async function gerarBriefingIA() {
    if (briefingIA) return
    setBriefingIA(true)
    try {
      const prompt =
        `Sugira um briefing de marca para o cliente "${client.nome}" ` +
        `(segmento: ${client.segmento || 'não informado'}). ` +
        `Responda em português do Brasil EXATAMENTE neste formato, sem nenhum texto extra:\n` +
        `TOM: <2 a 3 frases descrevendo o tom de voz>\n` +
        `REGRAS: <regras de marca em tópicos curtos separados por ponto e vírgula>`
      const res = await fetch('/api/assistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      if (res.ok && data.texto) {
        const tom = data.texto.match(/TOM:\s*([\s\S]*?)(?:\nREGRAS:|$)/i)
        const regras = data.texto.match(/REGRAS:\s*([\s\S]*)$/i)
        setBriefingForm((prev) => ({
          ...prev,
          tom_de_voz: tom ? tom[1].trim() : prev.tom_de_voz,
          regras_marca: regras ? regras[1].trim() : prev.regras_marca,
        }))
      }
    } finally {
      setBriefingIA(false)
    }
  }

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
    return <p className="text-sm text-neutral-400">Carregando...</p>
  }

  if (clientQuery.error) {
    return (
      <p className="text-sm text-red-400">
        Erro ao carregar cliente: {clientQuery.error.message}
      </p>
    )
  }

  const client = clientQuery.data

  return (
    <div>
      <Link to="/admin/clientes" className="text-sm text-neutral-400 hover:text-white transition-colors">
        ← Voltar para clientes
      </Link>

      <div className="mt-3 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-normal text-white">{client.nome}</h1>
          <p className="mt-1 text-sm text-neutral-400">{client.segmento || 'Sem segmento definido'}</p>
          <div className="mt-2 flex gap-4 text-sm text-neutral-400">
            <span>{client.contato_email || 'sem e-mail'}</span>
            <span>{client.contato_telefone || 'sem telefone'}</span>
          </div>
        </div>
        <button
          onClick={() => setShowEditClient(true)}
          className="rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-4 py-2 text-sm font-normal text-yellow-300 hover:bg-yellow-400/20 transition-colors"
        >
          Editar dados
        </button>
      </div>

      {/* Briefing */}
      <div className="mt-6 glass rounded-2xl p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-normal text-white">Briefing</h2>
            <p className="mt-1 text-xs text-neutral-400">
              Tom de voz, referências e regras de marca usadas pelo time na criação de conteúdo
            </p>
          </div>
          <button
            type="button"
            onClick={gerarBriefingIA}
            disabled={briefingIA}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-3 py-1.5 text-xs font-normal text-yellow-300 hover:bg-yellow-400/20 disabled:opacity-60 transition-colors"
          >
            {briefingIA ? 'Gerando...' : 'Sugerir com IA'}
          </button>
        </div>

        <form onSubmit={handleBriefingSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-normal text-neutral-300">Tom de voz</label>
            <textarea
              rows={2}
              value={briefingForm.tom_de_voz}
              onChange={(e) =>
                setBriefingForm((prev) => ({ ...prev, tom_de_voz: e.target.value }))
              }
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 resize-none"
              placeholder="Ex: Descontraído, próximo, sem gírias..."
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-normal text-neutral-300">Referências</label>
            <textarea
              rows={2}
              value={briefingForm.referencias}
              onChange={(e) =>
                setBriefingForm((prev) => ({ ...prev, referencias: e.target.value }))
              }
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 resize-none"
              placeholder="Links, perfis e materiais de referência"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-normal text-neutral-300">Regras de marca</label>
            <textarea
              rows={2}
              value={briefingForm.regras_marca}
              onChange={(e) =>
                setBriefingForm((prev) => ({ ...prev, regras_marca: e.target.value }))
              }
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 resize-none"
              placeholder="Cores, logotipo, palavras proibidas..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={briefingMutation.isPending}
              className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-500 disabled:opacity-60 transition-colors"
            >
              {briefingMutation.isPending ? 'Salvando...' : 'Salvar briefing'}
            </button>
            {briefingMutation.isSuccess && (
              <span className="text-xs text-emerald-400">Briefing salvo.</span>
            )}
            {briefingMutation.error && (
              <span className="text-xs text-red-400">{briefingMutation.error.message}</span>
            )}
          </div>
        </form>
      </div>

      {/* Planos */}
      <div className="mt-6 glass rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-normal text-white">Plano contratado</h2>
            <p className="mt-1 text-xs text-neutral-400">Histórico de pacotes contratados pelo cliente</p>
          </div>
          <button
            onClick={() => {
              setEditingPlan(null)
              setShowPlanForm(true)
            }}
            className="rounded-lg border border-white/15 px-3 py-2 text-sm font-normal text-neutral-300 hover:bg-white/5 transition-colors"
          >
            + Novo plano
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
          {plansQuery.isLoading && <p className="p-4 text-sm text-neutral-400">Carregando...</p>}
          {!plansQuery.isLoading && (plansQuery.data ?? []).length === 0 && (
            <p className="p-4 text-sm text-neutral-400">Nenhum plano cadastrado.</p>
          )}
          {(plansQuery.data ?? []).length > 0 && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-normal">Pacote</th>
                  <th className="px-4 py-3 font-normal">Valor</th>
                  <th className="px-4 py-3 font-normal">Período</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {plansQuery.data.map((plan) => (
                  <tr key={plan.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 font-normal text-white">{plan.pacote}</td>
                    <td className="px-4 py-3 text-neutral-300">{formatCurrency(plan.valor)}</td>
                    <td className="px-4 py-3 text-neutral-300">
                      {formatDate(plan.inicio)} – {formatDate(plan.fim)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-normal ${statusStyles[plan.status]}`}
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
                        className="mr-3 text-xs font-normal text-neutral-300 hover:text-white"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan)}
                        className="text-xs font-normal text-red-400 hover:text-red-300"
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
      <div className="mt-6 glass rounded-2xl p-6">
        <h2 className="text-base font-normal text-white">Chat com o cliente</h2>
        <p className="mt-1 text-xs text-neutral-400">Converse diretamente com o cliente sobre demandas e dúvidas</p>
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
          <p className="mt-3 text-sm text-red-400">{updateClientMutation.error.message}</p>
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
          <p className="mt-3 text-sm text-red-400">{planMutation.error.message}</p>
        )}
      </Modal>
    </div>
  )
}
