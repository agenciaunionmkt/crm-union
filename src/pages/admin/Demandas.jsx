import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { listClients } from '../../lib/api/clients'
import { listTeamUsers } from '../../lib/api/users'
import {
  createDemand,
  deleteDemand,
  listDemands,
  updateDemand,
  updateDemandStatus,
} from '../../lib/api/demands'
import { uploadAttachment } from '../../lib/api/attachments'
import { listCommentsFeed } from '../../lib/api/demandActivity'
import { notifyTeam } from '../../lib/api/notifications'
import { playSound } from '../../lib/sound'
import Modal from '../../components/ui/Modal'
import DemandForm from '../../components/DemandForm'
import DemandCalendar from '../../components/DemandCalendar'
import DemandActivity from '../../components/DemandActivity'
import DemandAttachments from '../../components/DemandAttachments'

export default function Demandas() {
  const { profile } = useAuth()
  const { isDark } = useTheme()
  const queryClient = useQueryClient()
  const location = useLocation()
  const navigate = useNavigate()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [editingDemand, setEditingDemand] = useState(null)
  const [defaultDate, setDefaultDate] = useState(null)
  const [prefillDesc, setPrefillDesc] = useState(null)
  const [pendingFiles, setPendingFiles] = useState([])
  const [clientFilter, setClientFilter] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  // Abre uma nova demanda com a descrição vinda do Assistente IA
  useEffect(() => {
    if (location.state?.descricao) {
      setEditingDemand(null)
      setDefaultDate(null)
      setPrefillDesc(location.state.descricao)
      setShowForm(true)
      navigate(location.pathname, { replace: true })
    }
  }, [location.state, location.pathname, navigate])

  const demandsQuery = useQuery({ queryKey: ['demands'], queryFn: () => listDemands() })

  // Abre direto a demanda comentada (vindo da caixa de Comentários)
  useEffect(() => {
    const id = location.state?.openDemandId
    if (id && demandsQuery.data) {
      const alvo = demandsQuery.data.find((d) => d.id === id)
      if (alvo) {
        openEditDemand(alvo)
        navigate(location.pathname, { replace: true })
      }
    }
  }, [location.state, location.pathname, navigate, demandsQuery.data])

  const clientsQuery = useQuery({ queryKey: ['clients'], queryFn: listClients })
  const teamQuery = useQuery({ queryKey: ['team-users'], queryFn: listTeamUsers })
  const commentsFeedQuery = useQuery({ queryKey: ['comments-feed'], queryFn: () => listCommentsFeed(), refetchInterval: 30000 })

  // Demandas com comentário de cliente ainda não visto (ponto no card)
  const comentariosLastSeen = localStorage.getItem('comentariosLastSeen')
  const comentadasIds = [
    ...new Set(
      (commentsFeedQuery.data ?? [])
        .filter((c) => c.autor?.papel === 'cliente' && (!comentariosLastSeen || c.created_at > comentariosLastSeen))
        .map((c) => c.demand_id)
    ),
  ]

  const saveMutation = useMutation({
    mutationFn: async ({ id, payload, tagIds }) => {
      if (id) return await updateDemand(id, payload, tagIds)
      const created = await createDemand(payload, tagIds)
      // Envia os anexos selecionados antes de salvar
      for (const file of pendingFiles) {
        try {
          await uploadAttachment(created.id, file, profile?.id)
        } catch (e) {
          console.warn('Falha ao enviar anexo:', e)
        }
      }
      return created
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['demands'] })

      // Feedback: som + sininho ao criar e ao concluir demanda
      if (!variables.id) {
        playSound('new')
        notifyTeam({
          titulo: 'Nova demanda',
          mensagem: data?.titulo ?? 'Demanda criada',
          link: '/admin/demandas',
        }).catch(() => {})
      }
      if (variables.virouConcluido) {
        playSound('done')
        notifyTeam({
          titulo: 'Demanda concluída',
          mensagem: data?.titulo ?? 'Uma demanda foi concluída',
          link: '/admin/demandas',
        }).catch(() => {})
      }

      // Notifica o cliente por e-mail quando o conteúdo vira "Aguardando aprovação"
      if (variables.notifyEntregue && data?.cliente_id) {
        const cliente = (clientsQuery.data ?? []).find((c) => c.id === data.cliente_id)
        if (cliente?.contato_email) {
          fetch('/api/notificar-demanda', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cliente.contato_email, nome: cliente.nome, titulo: data.titulo }),
          }).catch(() => {})
        }
      }
      if (variables.id) {
        closeForm()
        setSuccessMessage('Demanda atualizada!')
      } else {
        const teveAnexos = pendingFiles.length > 0
        queryClient.invalidateQueries({ queryKey: ['attachments', data.id] })
        setEditingDemand(data)
        setDefaultDate(null)
        setPendingFiles([])
        setSuccessMessage(teveAnexos ? 'Demanda criada e arquivos enviados!' : 'Demanda criada!')
      }
      setTimeout(() => setSuccessMessage(''), 4000)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDemand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demands'] })
      closeForm()
      setSuccessMessage('Demanda removida!')
      setTimeout(() => setSuccessMessage(''), 3000)
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateDemandStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['demands'] }),
  })

  function closeForm() {
    setShowForm(false)
    setEditingDemand(null)
    setDefaultDate(null)
    setPrefillDesc(null)
  }

  function openNewDemand(date) {
    setEditingDemand(null)
    setDefaultDate(date ? format(date, 'yyyy-MM-dd') : null)
    setPrefillDesc(null)
    setShowForm(true)
  }

  function openEditDemand(demand) {
    setEditingDemand(demand)
    setDefaultDate(null)
    setPrefillDesc(null)
    setShowForm(true)
  }

  function handleSubmit(values) {
    const virouEntregue = values.status === 'entregue' && editingDemand?.status !== 'entregue'
    const virouConcluido = values.status === 'concluido' && editingDemand?.status !== 'concluido'
    saveMutation.mutate({
      id: editingDemand?.id ?? null,
      payload: values,
      tagIds: [],
      notifyEntregue: virouEntregue,
      virouConcluido,
    })
  }

  function handleDelete() {
    if (editingDemand) {
      if (window.confirm(`Tem certeza que deseja excluir "${editingDemand.titulo}"? Essa ação não pode ser desfeita.`)) {
        deleteMutation.mutate(editingDemand.id)
      }
    }
  }

  const isLoading = demandsQuery.isLoading || clientsQuery.isLoading

  // Contagem de demandas por cliente
  const countMap = (() => {
    const counts = {}
    for (const d of demandsQuery.data ?? []) {
      if (d.cliente_id) counts[d.cliente_id] = (counts[d.cliente_id] || 0) + 1
    }
    return counts
  })()
  const clientesOrdenados = (clientsQuery.data ?? [])
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome))

  return (
    <div>
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-green-900/20 border border-green-700/50 px-4 py-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-sm font-normal text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Demandas
          </h1>
          <p className="mt-1 text-sm text-muted">
            Cronograma e gestão de demandas do seu time
          </p>
        </div>
        <button
          onClick={() => openNewDemand()}
          className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 text-gray-900 px-4 py-2 text-xs font-semibold hover:bg-yellow-500 transition-colors active:scale-95"
        >
          <span>+</span>
          <span>Nova demanda</span>
        </button>
      </div>

      {demandsQuery.error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-600 dark:text-red-400">
          Erro ao carregar demandas: {demandsQuery.error.message}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-4">
        {/* Lista de cronogramas (clientes) */}
        <aside className="glass rounded-2xl p-2 h-fit lg:sticky lg:top-4">
          <p className="px-3 py-2 text-xs uppercase tracking-widest text-muted">Cronogramas</p>
          <button
            type="button"
            onClick={() => setClientFilter(null)}
            className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              clientFilter === null ? 'union-active' : 'text-subtle hover:bg-white/5'
            }`}
          >
            <span>Todos os clientes</span>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/10 px-1.5 text-[11px] font-semibold">
              {(demandsQuery.data ?? []).length}
            </span>
          </button>
          <div className="mt-1 max-h-[60vh] overflow-y-auto">
            {clientesOrdenados.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setClientFilter(c.id)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  clientFilter === c.id ? 'union-active' : 'text-subtle hover:bg-white/5'
                }`}
              >
                <span className="truncate">{c.nome}</span>
                <span className="inline-flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-yellow-400/15 px-1.5 text-[11px] font-semibold text-yellow-300">
                  {countMap[c.id] || 0}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Cronograma do cliente selecionado */}
        <div>
          {isLoading && (
            <div className="text-center py-12">
              <p className="text-muted dark:text-muted">Carregando demandas...</p>
            </div>
          )}
          {!isLoading && (
            <DemandCalendar
              demands={
                clientFilter
                  ? (demandsQuery.data ?? []).filter((d) => d.cliente_id === clientFilter)
                  : (demandsQuery.data ?? [])
              }
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              onDayClick={openNewDemand}
              onCardClick={openEditDemand}
              commentDemandIds={comentadasIds}
            />
          )}
        </div>
      </div>

      <Modal
        open={showForm}
        title={editingDemand ? 'Editar demanda' : 'Nova demanda'}
        onClose={closeForm}
        maxWidth="max-w-2xl"
      >
        <DemandForm
          formId="demanda-form"
          hideActions
          initialValues={
            editingDemand ??
            (defaultDate || prefillDesc || clientFilter
              ? {
                  ...(defaultDate ? { prazo: defaultDate } : {}),
                  ...(prefillDesc ? { descricao: prefillDesc } : {}),
                  ...(clientFilter ? { cliente_id: clientFilter } : {}),
                }
              : null)
          }
          clients={clientsQuery.data}
          teamUsers={teamQuery.data}
          submitting={saveMutation.isPending}
          onCancel={closeForm}
          onSubmit={handleSubmit}
        />

        <div className="mt-6 border-t border-white/10 pt-4">
          <DemandAttachments
            demandId={editingDemand?.id}
            currentUser={profile}
            onPendingChange={setPendingFiles}
          />
        </div>

        {editingDemand && (
          <div className="mt-6 border-t border-white/10 pt-4">
            <DemandActivity demandId={editingDemand.id} mode="admin" currentUser={profile} demandTitulo={editingDemand.titulo} clienteId={editingDemand.cliente_id} />
          </div>
        )}

        {(saveMutation.error || deleteMutation.error) && (
          <p className="mt-4 text-sm text-red-400">
            {saveMutation.error?.message || deleteMutation.error?.message}
          </p>
        )}

        {/* Ações sempre no fim */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          {editingDemand ? (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg border border-red-500/40 px-3 py-2 text-xs font-normal text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Excluir demanda
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-normal text-subtle hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="demanda-form"
              disabled={saveMutation.isPending}
              className="rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-yellow-500 disabled:opacity-60 transition-colors"
            >
              {saveMutation.isPending ? 'Salvando...' : 'Salvar demanda'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
