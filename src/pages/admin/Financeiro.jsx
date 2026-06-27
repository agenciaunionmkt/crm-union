import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Trash2, ExternalLink } from 'lucide-react'
import {
  listFinancialEntries,
  createFinancialEntry,
  updateFinancialEntry,
  deleteFinancialEntry,
  getFinancialSummary,
} from '../../lib/api/financial'
import { listClients } from '../../lib/api/clients'
import Modal from '../../components/ui/Modal'
import FinancialForm from '../../components/FinancialForm'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Table, { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table'

const tipoLabels = {
  entrada: 'Entrada',
  saida: 'Saída',
}

// Formata YYYY-MM-DD sem conversão de fuso (evita "voltar" 1 dia).
function formatDate(value) {
  if (!value) return '—'
  const [y, m, d] = value.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}

export default function Financeiro() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const { data: entries, isLoading, error } = useQuery({
    queryKey: ['financial', { tipoFilter, statusFilter }],
    queryFn: () => listFinancialEntries({ tipo: tipoFilter, status: statusFilter }),
  })

  const { data: summary } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: getFinancialSummary,
  })

  const { data: clientes } = useQuery({
    queryKey: ['clients'],
    queryFn: listClients,
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
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Financeiro
          </h1>
          <p className="mt-1 text-sm text-muted">
            Gerencie entradas, saídas e transações financeiras
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null)
            setShowForm(true)
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-accent text-accent-foreground px-4 py-2 text-xs font-semibold hover:opacity-90 transition-colors"
        >
          <span>+</span>
          <span>Nova Transação</span>
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="glass glass-hover rounded-2xl p-6">
            <p className="text-xs uppercase tracking-widest text-muted">Saldo (recebido − pago)</p>
            <p className="text-2xl font-black tracking-tight text-foreground">R$ {summary.saldo.toFixed(2)}</p>
          </div>

          <div className="glass glass-hover rounded-2xl p-6">
            <p className="text-xs uppercase tracking-widest text-muted">Recebido</p>
            <p className="text-2xl font-normal text-emerald-400">R$ {summary.recebido.toFixed(2)}</p>
          </div>

          <div className="glass glass-hover rounded-2xl p-6">
            <p className="text-xs uppercase tracking-widest text-muted">A receber</p>
            <p className="text-2xl font-normal text-orange-400">R$ {summary.aReceber.toFixed(2)}</p>
          </div>

          <div className="glass glass-hover rounded-2xl p-6">
            <p className="text-xs uppercase tracking-widest text-muted">Saídas pagas</p>
            <p className="text-2xl font-normal text-danger">R$ {summary.saidasPagas.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          type="text"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)}>
          <option value="">Todos os tipos</option>
          <option value="entrada">Entradas</option>
          <option value="saida">Saídas</option>
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="pendente">Pendentes</option>
          <option value="pago">Pagos</option>
          <option value="vencido">Vencidos</option>
        </Select>
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
              <TableCell colSpan={7} className="text-center py-8 text-muted">
                Carregando transações...
              </TableCell>
            </TableRow>
          )}

          {error && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-danger">
                Erro ao carregar: {error.message}
              </TableCell>
            </TableRow>
          )}

          {!isLoading && filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted">
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
                <span className={entry.tipo === 'entrada' ? 'text-green-600 dark:text-success font-medium' : 'text-danger font-medium'}>
                  {entry.tipo === 'entrada' ? '+' : '-'} R$ {entry.valor.toFixed(2)}
                </span>
              </TableCell>
              <TableCell>
                {formatDate(entry.vencimento)}
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
                  {entry.link_pagamento && (
                    <a
                      href={entry.link_pagamento}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded text-muted hover:bg-white/5 hover:text-accent transition-colors"
                      title="Abrir fatura (PIX/boleto)"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleEdit(entry)}
                    className="p-1.5 rounded text-muted transition-colors"
                    title="Editar transação"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry)}
                    className="p-1.5 rounded text-muted transition-colors"
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
          clientes={clientes}
          submitting={createMutation.isPending || updateMutation.isPending}
          onCancel={handleCloseForm}
          onSubmit={handleSubmit}
        />
        {(createMutation.error || updateMutation.error) && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-danger/10 border border-red-200 text-sm text-danger">
            {createMutation.error?.message || updateMutation.error?.message}
          </div>
        )}
      </Modal>
    </div>
  )
}
