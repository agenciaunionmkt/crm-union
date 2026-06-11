import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Trash2 } from 'lucide-react'
import {
  listFinancialEntries,
  createFinancialEntry,
  updateFinancialEntry,
  deleteFinancialEntry,
  getFinancialSummary,
} from '../../lib/api/financial'
import Modal from '../../components/ui/Modal'
import FinancialForm from '../../components/FinancialForm'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Table, { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table'

const statusColors = {
  pendente: { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100' },
  pago: { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100' },
  vencido: { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100' },
}

const tipoLabels = {
  entrada: 'Entrada',
  saida: 'Saída',
}

export default function Financeiro() {
  const queryClient = useQueryClient()
  const { isDark } = useTheme()
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const inputStyle = !isDark ? { backgroundColor: '#ffffff', borderColor: '#d4d4d8', color: '#1a1a1a' } : {}

  const { data: entries, isLoading, error } = useQuery({
    queryKey: ['financial', { tipoFilter, statusFilter }],
    queryFn: () => listFinancialEntries({ tipo: tipoFilter, status: statusFilter }),
  })

  const { data: summary } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: getFinancialSummary,
  })

  const createMutation = useMutation({
    mutationFn: createFinancialEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
      setShowForm(false)
      setEditingId(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateFinancialEntry(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
      setShowForm(false)
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFinancialEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
    },
  })

  const filtered = (entries ?? []).filter((e) =>
    e.nome.toLowerCase().includes(search.toLowerCase())
  )

  function handleDelete(entry) {
    if (
      window.confirm(
        `Remover "${entry.nome}"? Essa ação não pode ser desfeita.`
      )
    ) {
      deleteMutation.mutate(entry.id)
    }
  }

  function handleEdit(entry) {
    setEditingId(entry.id)
    setShowForm(true)
  }

  function handleSubmit(values) {
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: values })
    } else {
      createMutation.mutate(values)
    }
  }

  function handleCloseForm() {
    setShowForm(false)
    setEditingId(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-normal text-neutral-900 dark:text-white">
            Financeiro
          </h1>
          <p className="mt-1 text-xs text-neutral-900 dark:text-neutral-400" style={!isDark ? { color: '#1a1a1a' } : {}}>
            Gerencie entradas, saídas e transações financeiras
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null)
            setShowForm(true)
          }}
          className="inline-flex items-center gap-2 rounded-md border border-emerald-400 dark:border-emerald-500/60 text-emerald-600 dark:text-emerald-400 px-4 py-2 text-xs font-normal bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-800/30 transition-colors"
        >
          <span>+</span>
          <span>Nova Transação</span>
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="rounded-2xl border border-neutral-700/50 bg-neutral-900/50 backdrop-blur-xl p-6 hover:border-neutral-600/50 transition-colors">
            <p className="text-xs uppercase tracking-widest text-neutral-500">
              Saldo
            </p>
            <p className=" text-2xl font-normal text-white">
              R$ {summary.saldo.toFixed(2)}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-300 dark:border-green-700/50 bg-white dark:bg-green-900/20 backdrop-blur-sm dark:backdrop-blur-xl p-5 shadow-sm dark:shadow-lg hover:shadow-md dark:hover:shadow-xl transition-all">
            <p className="text-xs uppercase tracking-widest text-neutral-500">
              Entradas
            </p>
            <p className=" text-2xl font-normal text-white">
              R$ {summary.totalEntradas.toFixed(2)}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-300 dark:border-red-700/50 bg-white dark:bg-red-900/20 backdrop-blur-sm dark:backdrop-blur-xl p-5 shadow-sm dark:shadow-lg hover:shadow-md dark:hover:shadow-xl transition-all">
            <p className="text-xs uppercase tracking-widest text-neutral-500">
              Saídas
            </p>
            <p className=" text-2xl font-normal text-white">
              R$ {summary.totalSaidas.toFixed(2)}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-300 dark:border-orange-700/50 bg-white dark:bg-orange-900/20 backdrop-blur-sm dark:backdrop-blur-xl p-5 shadow-sm dark:shadow-lg hover:shadow-md dark:hover:shadow-xl transition-all">
            <p className="text-xs uppercase tracking-widest text-neutral-500">
              Pendentes
            </p>
            <p className=" text-2xl font-normal text-white">
              R$ {summary.pendentes.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          style={inputStyle}
        />
        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
          style={inputStyle}
        >
          <option value="">Todos os tipos</option>
          <option value="entrada">Entradas</option>
          <option value="saida">Saídas</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
          style={inputStyle}
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendentes</option>
          <option value="pago">Pagos</option>
          <option value="vencido">Vencidos</option>
        </select>
      </div>

      {/* Table */}
      <Table>
        <TableHead>
          <TableRow isHeader>
            <TableHeader>Tipo</TableHeader>
            <TableHeader>Nome</TableHeader>
            <TableHeader>Valor</TableHeader>
            <TableHeader>Vencimento</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Recorrente</TableHeader>
            <TableHeader className="text-right">Ações</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-neutral-500">
                Carregando transações...
              </TableCell>
            </TableRow>
          )}

          {error && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-red-600 dark:text-red-400">
                Erro ao carregar: {error.message}
              </TableCell>
            </TableRow>
          )}

          {!isLoading && filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                Nenhuma transação encontrada
              </TableCell>
            </TableRow>
          )}

          {!isLoading && filtered.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{tipoLabels[entry.tipo]}</TableCell>
              <TableCell className="font-medium text-slate-900 dark:text-white">
                {entry.nome}
              </TableCell>
              <TableCell>
                <span className={entry.tipo === 'entrada' ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>
                  {entry.tipo === 'entrada' ? '+' : '-'} R$ {entry.valor.toFixed(2)}
                </span>
              </TableCell>
              <TableCell>
                {new Date(entry.vencimento).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell>
                <Badge variant={
                  entry.status === 'pendente' ? 'warning' :
                  entry.status === 'pago' ? 'success' :
                  'danger'
                }>
                  {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                {entry.recorrente ? (
                  <Badge variant="primary">
                    {entry.frequencia.charAt(0).toUpperCase() + entry.frequencia.slice(1)}
                  </Badge>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="p-1.5 rounded text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/40 transition-colors"
                    title="Editar transação"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry)}
                    className="p-1.5 rounded text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/40 transition-colors"
                    title="Remover transação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Modal */}
      <Modal
        open={showForm}
        title={editingId ? 'Editar Transação' : 'Nova Transação'}
        onClose={handleCloseForm}
      >
        <FinancialForm
          initialValues={
            editingId ? filtered.find((e) => e.id === editingId) : undefined
          }
          submitting={createMutation.isPending || updateMutation.isPending}
          onCancel={handleCloseForm}
          onSubmit={handleSubmit}
        />
        {(createMutation.error || updateMutation.error) && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            {createMutation.error?.message || updateMutation.error?.message}
          </div>
        )}
      </Modal>
    </div>
  )
}
