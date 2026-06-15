import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()

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
      queryClient.invalidateQueries({ queryKey: ['clients', id] })
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

      <div className="mt-3">
        <h1 className="text-2xl font-normal text-white">{client.nome}</h1>
        <p className="mt-1 text-sm text-neutral-400">{client.segmento || 'Sem segmento definido'}</p>
      </div>

      {/* Dados do cliente (edição inline) */}
      <div className="mt-6 glass rounded-2xl p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-normal text-white">Dados do cliente</h2>
          {updateClientMutation.isSuccess && (
            <span className="text-xs text-emerald-400">Dados salvos</span>
          )}
        </div>
        <ClientForm
          initialValues={client}
          submitting={updateClientMutation.isPending}
          onCancel={() => navigate('/admin/clientes')}
          onSubmit={(values) => updateClientMutation.mutate(values)}
        />
        {updateClientMutation.error && (
          <p className="mt-3 text-sm text-red-400">{updateClientMutation.error.message}</p>
        )}
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

      {/* Chat com o cliente */}
      <div className="mt-6 glass rounded-2xl p-6">
        <h2 className="text-base font-normal text-white">Chat com o cliente</h2>
        <p className="mt-1 text-xs text-neutral-400">Converse diretamente com o cliente sobre demandas e dúvidas</p>
        <div className="mt-4 h-80">
          <ChatWindow clienteId={id} currentUser={profile} />
        </div>
      </div>

    </div>
  )
}
