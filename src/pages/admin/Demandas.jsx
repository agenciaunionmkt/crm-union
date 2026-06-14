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
  const clientsQuery = useQuery({ queryKey: ['clients'], queryFn: listClients })
  const teamQuery = useQuery({ queryKey: ['team-users'], queryFn: listTeamUsers })

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
    saveMutation.mutate({ id: editingDemand?.id ?? null, payload: values, tagIds: [] })
  }

  function handleDelete() {
    if (editingDemand) {
      if (window.confirm(`Tem certeza que deseja excluir "${editingDemand.titulo}"? Essa ação não pode ser desfeita.`)) {
        deleteMutation.mutate(editingDemand.id)
      }
    }
  }

  const isLoading = demandsQuery.isLoading || clientsQuery.isLoading

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
          <h1 className="text-2xl font-normal text-neutral-900 dark:text-white">
            Demandas
          </h1>
          <p className="mt-1 text-xs text-neutral-900 dark:text-neutral-400" style={!isDark ? { color: '#1a1a1a' } : {}}>
            Cronograma e gestão de demandas do seu time
          </p>
        </div>
        <button
          onClick={() => openNewDemand()}
          className="inline-flex items-center gap-2 rounded-md border border-emerald-400 dark:border-emerald-500/60 text-emerald-600 dark:text-emerald-400 px-4 py-2 text-xs font-normal bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-800/30 transition-colors active:scale-95"
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

      <div className="mt-6">
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-neutral-500 dark:text-neutral-400">Carregando demandas...</p>
          </div>
        )}

        {!isLoading && (
          <div>
            <DemandCalendar
              demands={demandsQuery.data ?? []}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              onDayClick={openNewDemand}
              onCardClick={openEditDemand}
            />
          </div>
        )}
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
            (defaultDate || prefillDesc
              ? { ...(defaultDate ? { prazo: defaultDate } : {}), ...(prefillDesc ? { descricao: prefillDesc } : {}) }
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
            <DemandActivity demandId={editingDemand.id} mode="admin" currentUser={profile} />
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
              className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-normal text-neutral-300 hover:bg-white/5 transition-colors"
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
