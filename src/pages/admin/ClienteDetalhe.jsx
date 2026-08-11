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
  archiveClient,
} from '../../lib/api/clients'
import { inviteClientUser } from '../../lib/api/users'
import Modal from '../../components/Modal'
import ClientForm from '../../components/ClientForm'
import PlanForm from '../../components/PlanForm'
import ChatWindow from '../../components/ChatWindow'
import ContractsPanel from '../../components/ContractsPanel'
import AsaasPanel from '../../components/AsaasPanel'
import MateriaisPanel from '../../components/MateriaisPanel'
import NotesPanel from '../../components/NotesPanel'

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

  const [aba, setAba] = useState('geral')
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [acessoEmail, setAcessoEmail] = useState('')
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

  useEffect(() => {
    if (clientQuery.data?.contato_email) setAcessoEmail(clientQuery.data.contato_email)
  }, [clientQuery.data])

  const updateClientMutation = useMutation({
    mutationFn: (payload) => updateClient(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['clients', id] })
    },
  })

  const inviteMutation = useMutation({
    mutationFn: () => inviteClientUser({ email: acessoEmail, nome: clientQuery.data?.nome, clienteId: id }),
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

  const [motivoSaida, setMotivoSaida] = useState('')
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  const archiveMutation = useMutation({
    mutationFn: () => archiveClient(id, motivoSaida),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['clients-inativos'] })
      queryClient.invalidateQueries({ queryKey: ['financial-all'] })
      navigate('/admin/clientes')
    },
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
    return <p className="text-sm text-muted">Carregando...</p>
  }

  if (clientQuery.error) {
    return (
      <p className="text-sm text-danger">
        Erro ao carregar cliente: {clientQuery.error.message}
      </p>
    )
  }

  const client = clientQuery.data

  return (
    <div>
      <Link to="/admin/clientes" className="text-sm text-muted hover:text-foreground transition-colors">
        ← Voltar para clientes
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">{client.nome}</h1>
          <p className="mt-1 text-sm text-muted">{client.segmento || 'Sem segmento definido'}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowArchiveConfirm(true)}
          className="flex-shrink-0 rounded-xl border border-border px-3 py-2 text-xs text-muted hover:border-danger/40 hover:text-danger hover:bg-danger/5 transition-colors"
        >
          Arquivar cliente
        </button>
      </div>

      {/* Modal de arquivamento */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <h3 className="font-semibold text-foreground">Arquivar cliente</h3>
            <p className="mt-1 text-sm text-muted">
              O cliente sairá da lista ativa e ficará em "Ex-clientes". O histórico é preservado.
            </p>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs text-muted">Motivo da saída (opcional)</label>
              <input
                type="text"
                value={motivoSaida}
                onChange={(e) => setMotivoSaida(e.target.value)}
                placeholder="Ex: encerrou contrato, mudou de agência..."
                className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm text-foreground placeholder-neutral-500 focus:border-accent/50 focus:outline-none"
              />
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(false)}
                className="flex-1 rounded-xl border border-border px-4 py-2 text-sm text-muted hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => archiveMutation.mutate()}
                disabled={archiveMutation.isPending}
                className="flex-1 rounded-xl border border-danger/40 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/20 disabled:opacity-50 transition-colors"
              >
                {archiveMutation.isPending ? 'Arquivando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Abas */}
      <div className="mt-6 flex rounded-lg border border-border p-0.5 bg-surface w-fit">
        {[['geral', 'Visão geral'], ['anotacoes', 'Anotações']].map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => setAba(val)}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
              aba === val
                ? 'bg-white/10 text-foreground'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Aba: Anotações / fichas técnicas */}
      {aba === 'anotacoes' && (
        <div className="mt-6 glass rounded-2xl p-6">
          <h2 className="mb-4 text-base font-black tracking-tight text-foreground">Anotações</h2>
          <NotesPanel clienteId={id} />
        </div>
      )}

      {aba === 'geral' && (
      <>
      {/* Dados do cliente (edição inline) */}
      <div className="mt-6 glass rounded-2xl p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-black tracking-tight text-foreground">Dados do cliente</h2>
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
          <p className="mt-3 text-sm text-danger">{updateClientMutation.error.message}</p>
        )}
      </div>

      {/* Acesso ao portal */}
      <div className="mt-6 glass rounded-2xl p-6">
        <h2 className="text-base font-black tracking-tight text-foreground">Acesso ao portal</h2>
        <p className="mt-1 text-xs text-muted">
          Envie ao cliente um link para ele criar a senha e acessar o portal. Use também para reenviar o acesso.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <label className="mb-1.5 block text-sm font-normal text-subtle">E-mail de acesso</label>
            <input
              type="email"
              value={acessoEmail}
              onChange={(e) => setAcessoEmail(e.target.value)}
              placeholder="cliente@empresa.com"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
            />
          </div>
          <button
            type="button"
            onClick={() => inviteMutation.mutate()}
            disabled={inviteMutation.isPending || !acessoEmail.trim()}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-gray-900 hover:opacity-90 disabled:opacity-60 transition-colors"
          >
            {inviteMutation.isPending ? 'Enviando...' : 'Enviar acesso'}
          </button>
        </div>
        {inviteMutation.isSuccess && (
          <p className="mt-2 text-xs text-emerald-400">Link de acesso enviado para o e-mail.</p>
        )}
        {inviteMutation.error && (
          <p className="mt-2 text-xs text-danger">{inviteMutation.error.message}</p>
        )}
      </div>

      {/* Briefing */}
      <div className="mt-6 glass rounded-2xl p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black tracking-tight text-foreground">Briefing</h2>
            <p className="mt-1 text-xs text-muted">
              Tom de voz, referências e regras de marca usadas pelo time na criação de conteúdo
            </p>
          </div>
          <button
            type="button"
            onClick={gerarBriefingIA}
            disabled={briefingIA}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-normal text-accent hover:bg-accent/20 disabled:opacity-60 transition-colors"
          >
            {briefingIA ? 'Gerando...' : 'Sugerir com IA'}
          </button>
        </div>

        <form onSubmit={handleBriefingSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-normal text-subtle">Tom de voz</label>
            <textarea
              rows={2}
              value={briefingForm.tom_de_voz}
              onChange={(e) =>
                setBriefingForm((prev) => ({ ...prev, tom_de_voz: e.target.value }))
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 resize-none"
              placeholder="Ex: Descontraído, próximo, sem gírias..."
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-normal text-subtle">Referências</label>
            <textarea
              rows={2}
              value={briefingForm.referencias}
              onChange={(e) =>
                setBriefingForm((prev) => ({ ...prev, referencias: e.target.value }))
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 resize-none"
              placeholder="Links, perfis e materiais de referência"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-normal text-subtle">Regras de marca</label>
            <textarea
              rows={2}
              value={briefingForm.regras_marca}
              onChange={(e) =>
                setBriefingForm((prev) => ({ ...prev, regras_marca: e.target.value }))
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 resize-none"
              placeholder="Cores, logotipo, palavras proibidas..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={briefingMutation.isPending}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-gray-900 hover:opacity-90 disabled:opacity-60 transition-colors"
            >
              {briefingMutation.isPending ? 'Salvando...' : 'Salvar briefing'}
            </button>
            {briefingMutation.isSuccess && (
              <span className="text-xs text-emerald-400">Briefing salvo.</span>
            )}
            {briefingMutation.error && (
              <span className="text-xs text-danger">{briefingMutation.error.message}</span>
            )}
          </div>
        </form>
      </div>

      {/* Materiais do cliente */}
      <div className="mt-6 glass rounded-2xl p-6">
        <h2 className="text-base font-black tracking-tight text-foreground">Materiais</h2>
        <p className="mt-1 text-xs text-muted">
          Logo, fotos, PDFs e outros materiais enviados pelo cliente.
        </p>
        <div className="mt-4">
          <MateriaisPanel clienteId={id} currentUser={profile} canUpload={false} />
        </div>
      </div>

      {/* Contratos */}
      <div className="mt-6 glass rounded-2xl p-6">
        <h2 className="text-base font-black tracking-tight text-foreground">Contratos</h2>
        <p className="mt-1 text-xs text-muted">
          Envie um contrato em PDF para o cliente assinar pelo Autentique. O status é atualizado automaticamente quando ele assinar.
        </p>
        <div className="mt-4">
          <ContractsPanel
            clienteId={id}
            cliente={client}
            defaultEmail={client.contato_email ?? ''}
            currentUser={profile}
            mode="admin"
          />
        </div>
      </div>

      {/* Cobranças (Asaas) */}
      <div className="mt-6 glass rounded-2xl p-6">
        <h2 className="text-base font-black tracking-tight text-foreground">Cobranças (Asaas)</h2>
        <p className="mt-1 text-xs text-muted">
          Gere cobranças por PIX/boleto. Quando o cliente paga, o lançamento no Financeiro é marcado como pago automaticamente.
        </p>
        <div className="mt-4">
          <AsaasPanel cliente={client} />
        </div>
      </div>

      {/* Chat com o cliente */}
      <div className="mt-6 glass rounded-2xl p-6">
        <h2 className="text-base font-black tracking-tight text-foreground">Chat com o cliente</h2>
        <p className="mt-1 text-xs text-muted">Converse diretamente com o cliente sobre demandas e dúvidas</p>
        <div className="mt-4 h-80">
          <ChatWindow clienteId={id} currentUser={profile} />
        </div>
      </div>
      </>
      )}

    </div>
  )
}
