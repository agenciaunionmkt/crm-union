import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, ChevronLeft, ChevronRight, Circle, Edit, Trash2, ExternalLink } from 'lucide-react'
import {
  listFinancialEntries,
  createFinancialEntry,
  updateFinancialEntry,
  deleteFinancialEntry,
  ensureMonthlyRecurring,
  toggleEntryPaid,
} from '../../lib/api/financial'
import { listClients } from '../../lib/api/clients'
import Modal from '../../components/ui/Modal'
import FinancialForm from '../../components/FinancialForm'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Table, { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table'

const tipoLabels = { entrada: 'Entrada', saida: 'Saída' }

function formatDate(value) {
  if (!value) return '—'
  const [y, m, d] = value.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}

function formatBRL(value) {
  return (value ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Financeiro() {
  const queryClient = useQueryClient()
  const [search, setSearch]           = useState('')
  const [tipoFilter, setTipoFilter]   = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm]       = useState(false)
  const [editingId, setEditingId]     = useState(null)
  const [sortField, setSortField]     = useState('vencimento')
  const [sortDir, setSortDir]         = useState('asc')

  function handleSortByTipo() {
    if (sortField === 'tipo') {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField('tipo')
      setSortDir('asc')
    }
  }

  // Navegação por mês
  const today = useMemo(() => new Date(), [])
  const [selYear, setSelYear]   = useState(today.getFullYear())
  const [selMonth, setSelMonth] = useState(today.getMonth() + 1)

  const selectedMonth  = `${selYear}-${String(selMonth).padStart(2, '0')}`
  const isCurrentMonth = selYear === today.getFullYear() && selMonth === today.getMonth() + 1

  function handlePrevMonth() {
    if (selMonth === 1) { setSelYear((y) => y - 1); setSelMonth(12) }
    else setSelMonth((m) => m - 1)
  }
  function handleNextMonth() {
    if (isCurrentMonth) return
    if (selMonth === 12) { setSelYear((y) => y + 1); setSelMonth(1) }
    else setSelMonth((m) => m + 1)
  }

  // Query única sem filtros — toda lógica de filtragem é feita no frontend
  const { data: allEntries, isLoading, error } = useQuery({
    queryKey: ['financial-all'],
    queryFn: listFinancialEntries,
  })

  const { data: clientes } = useQuery({
    queryKey: ['clients'],
    queryFn: listClients,
  })

  // Auto-criação de mensalidades do mês atual
  const ensuredRef = useRef(false)
  useEffect(() => {
    if (!clientes || !allEntries || ensuredRef.current) return
    ensuredRef.current = true
    const recorrentesClients = clientes.filter((c) => c.tipo_cliente === 'recorrente' && c.valor_servico)
    ensureMonthlyRecurring(recorrentesClients, allEntries).then((created) => {
      if (created) queryClient.invalidateQueries({ queryKey: ['financial-all'] })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientes, allEntries])

  // Entradas da tabela:
  // - Mês selecionado (qualquer status)
  // - Se for mês atual: também pendentes/vencidos de meses anteriores
  const tableEntries = useMemo(() => {
    const mesInicio = `${selectedMonth}-01`
    return (allEntries ?? [])
      .filter((e) => {
        const noMes         = e.vencimento?.startsWith(selectedMonth)
        const vencidoAberto = isCurrentMonth &&
          e.vencimento < mesInicio &&
          (e.status === 'pendente' || e.status === 'vencido')
        if (!noMes && !vencidoAberto) return false
        if (tipoFilter   && e.tipo   !== tipoFilter)   return false
        if (statusFilter && e.status !== statusFilter) return false
        if (search && !e.nome.toLowerCase().includes(search.toLowerCase())) return false
        return true
      })
      .sort((a, b) => {
        if (sortField === 'tipo') {
          const cmp = a.tipo.localeCompare(b.tipo)
          return sortDir === 'asc' ? cmp : -cmp
        }
        return (a.vencimento ?? '').localeCompare(b.vencimento ?? '')
      })
  }, [allEntries, selectedMonth, isCurrentMonth, tipoFilter, statusFilter, search, sortField, sortDir])

  // Resumo calculado das entradas filtradas do mês
  const summary = useMemo(() => {
    const s = { recebido: 0, aReceber: 0, saidasPagas: 0, saldo: 0 }
    tableEntries.forEach((e) => {
      const v = e.valor || 0
      if (e.tipo === 'entrada') {
        if (e.status === 'pago') s.recebido += v
        else s.aReceber += v
      } else {
        if (e.status === 'pago') s.saidasPagas += v
      }
    })
    s.saldo = s.recebido - s.saidasPagas
    return s
  }, [tableEntries])

  // Painel de mensalidades — uma entrada por cliente recorrente no mês selecionado
  const recorrentes = useMemo(() => {
    return (clientes ?? [])
      .filter((c) => c.tipo_cliente === 'recorrente')
      .map((c) => {
        const doMes = (allEntries ?? []).filter(
          (e) => e.cliente_id === c.id && e.tipo === 'entrada' && e.vencimento?.startsWith(selectedMonth)
        )
        if (!doMes.length) return null
        return doMes.find((e) => e.status === 'pago') ?? doMes.reduce((a, b) => (a.id > b.id ? a : b))
      })
      .filter(Boolean)
      .sort((a, b) => a.nome.localeCompare(b.nome))
  }, [clientes, allEntries, selectedMonth])

  const rPago = recorrentes.filter((e) => e.status === 'pago').length

  const invalidateAll = () => queryClient.invalidateQueries({ queryKey: ['financial-all'] })

  const createMutation = useMutation({
    mutationFn: createFinancialEntry,
    onSuccess: () => { invalidateAll(); setShowForm(false); setEditingId(null) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateFinancialEntry(id, payload),
    onSuccess: () => { invalidateAll(); setShowForm(false); setEditingId(null) },
  })

  const togglePaidMutation = useMutation({
    mutationFn: toggleEntryPaid,
    onSuccess: invalidateAll,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFinancialEntry,
    onSuccess: invalidateAll,
  })

  function handleDelete(entry) {
    if (window.confirm(`Remover "${entry.nome}"? Essa ação não pode ser desfeita.`)) {
      deleteMutation.mutate(entry.id)
    }
  }

  function handleEdit(entry) {
    setEditingId(entry.id)
    setShowForm(true)
  }

  function handleSubmit(values) {
    if (editingId) updateMutation.mutate({ id: editingId, payload: values })
    else createMutation.mutate(values)
  }

  function handleCloseForm() {
    setShowForm(false)
    setEditingId(null)
  }

  const mesLabel = new Date(selYear, selMonth - 1)
    .toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Financeiro</h1>
          <p className="mt-1 text-sm text-muted">Gerencie entradas, saídas e transações financeiras</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Navegação de mês */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-surface px-2 py-1.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded text-muted hover:text-foreground transition-colors"
              title="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[140px] text-center text-sm font-medium text-foreground capitalize">
              {mesLabel}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              disabled={isCurrentMonth}
              className="p-1 rounded text-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => { setEditingId(null); setShowForm(true) }}
            className="inline-flex items-center gap-2 rounded-xl bg-accent text-accent-foreground px-4 py-2 text-xs font-semibold hover:opacity-90 transition-colors"
          >
            <span>+</span>
            <span>Nova Transação</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="glass glass-hover rounded-2xl p-6">
          <p className="text-xs uppercase tracking-widest text-muted">Saldo (recebido − saídas)</p>
          <p className="text-2xl font-black tracking-tight text-foreground">R$ {formatBRL(summary.saldo)}</p>
        </div>
        <div className="glass glass-hover rounded-2xl p-6">
          <p className="text-xs uppercase tracking-widest text-muted">Recebido</p>
          <p className="text-2xl font-normal text-emerald-400">R$ {formatBRL(summary.recebido)}</p>
        </div>
        <div className="glass glass-hover rounded-2xl p-6">
          <p className="text-xs uppercase tracking-widest text-muted">A receber</p>
          <p className="text-2xl font-normal text-orange-400">R$ {formatBRL(summary.aReceber)}</p>
        </div>
        <div className="glass glass-hover rounded-2xl p-6">
          <p className="text-xs uppercase tracking-widest text-muted">Saídas pagas</p>
          <p className="text-2xl font-normal text-danger">R$ {formatBRL(summary.saidasPagas)}</p>
        </div>
      </div>

      {/* Painel de Mensalidades */}
      {recorrentes.length > 0 && (
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted capitalize">
              Mensalidades — {mesLabel}
            </h2>
            <span className="text-xs text-muted">{rPago}/{recorrentes.length} pagos</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recorrentes.map((e) => {
              const pago    = e.status === 'pago'
              const vencido = e.status === 'vencido'
              const nome    = e.nome.replace(/^mensalidade\s*[-–]\s*/i, '')
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => togglePaidMutation.mutate(e)}
                  disabled={togglePaidMutation.isPending}
                  title={pago ? 'Marcar como pendente' : 'Marcar como pago'}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors
                    ${pago
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : vencido
                      ? 'border-danger/30 bg-danger/10 text-danger hover:bg-danger/15'
                      : 'border-border bg-surface text-muted hover:bg-surface-2 hover:text-foreground'
                    }`}
                >
                  {pago
                    ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                    : <Circle className="h-3.5 w-3.5 flex-shrink-0" />
                  }
                  {nome}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Filtros */}
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

      {/* Tabela */}
      <Table>
        <TableHead>
          <TableRow isHeader>
            <TableHeader>
              <button
                type="button"
                onClick={handleSortByTipo}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                title="Ordenar por tipo"
              >
                Tipo
                {sortField === 'tipo' ? (
                  sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                ) : (
                  <ArrowUpDown className="h-3 w-3 opacity-40" />
                )}
              </button>
            </TableHeader>
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
          {!isLoading && tableEntries.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted">
                Nenhuma transação em {mesLabel}
              </TableCell>
            </TableRow>
          )}
          {!isLoading && tableEntries.map((entry) => {
            const pastMonth = entry.vencimento < `${selectedMonth}-01`
            return (
              <TableRow key={entry.id}>
                <TableCell>{tipoLabels[entry.tipo]}</TableCell>
                <TableCell className="font-medium text-foreground">
                  {entry.nome}
                  {pastMonth && (
                    <span className="ml-2 text-[10px] text-danger/70 font-normal">em aberto</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={entry.tipo === 'entrada' ? 'text-success font-medium' : 'text-danger font-medium'}>
                    {entry.tipo === 'entrada' ? '+' : '-'} R$ {formatBRL(entry.valor)}
                  </span>
                </TableCell>
                <TableCell className={pastMonth ? 'text-danger' : ''}>
                  {formatDate(entry.vencimento)}
                </TableCell>
                <TableCell>
                  <Badge variant={
                    entry.status === 'pendente' ? 'warning' :
                    entry.status === 'pago'     ? 'success' : 'danger'
                  }>
                    {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {entry.recorrente ? (
                    <Badge variant="primary">
                      {entry.frequencia?.charAt(0).toUpperCase() + entry.frequencia?.slice(1)}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted">—</span>
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
                        title="Abrir fatura"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleEdit(entry)}
                      className="p-1.5 rounded text-muted transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry)}
                      className="p-1.5 rounded text-muted transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Modal */}
      <Modal
        open={showForm}
        title={editingId ? 'Editar Transação' : 'Nova Transação'}
        onClose={handleCloseForm}
      >
        <FinancialForm
          initialValues={editingId ? (allEntries ?? []).find((e) => e.id === editingId) : undefined}
          clientes={clientes}
          submitting={createMutation.isPending || updateMutation.isPending}
          onCancel={handleCloseForm}
          onSubmit={handleSubmit}
        />
        {(createMutation.error || updateMutation.error) && (
          <div className="mt-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger">
            {createMutation.error?.message || updateMutation.error?.message}
          </div>
        )}
      </Modal>
    </div>
  )
}
