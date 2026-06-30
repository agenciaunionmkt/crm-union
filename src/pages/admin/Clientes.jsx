import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Trash2, AlertCircle, CheckCircle, RotateCcw, Archive } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabaseClient'
import { createClient, deleteClient, listClients, listInactiveClients, restoreClient, archiveClient } from '../../lib/api/clients'
import { inviteClientUser } from '../../lib/api/users'
import Modal from '../../components/ui/Modal'
import ClientForm from '../../components/ClientForm'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Table, { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table'

// Calcula a próxima data de vencimento a partir de um dia do mês (1-31).
// Se o dia já passou neste mês, usa o mês seguinte.
function proximoVencimento(dia) {
  const hoje = new Date()
  const d = parseInt(dia, 10)
  if (!d) return hoje.toISOString().split('T')[0]
  let ano = hoje.getFullYear()
  let mes = hoje.getMonth()
  if (d < hoje.getDate()) mes += 1
  const ultimoDia = new Date(ano, mes + 1, 0).getDate()
  const diaFinal = Math.min(d, ultimoDia)
  const data = new Date(ano, mes, diaFinal)
  return data.toISOString().split('T')[0]
}

export default function Clientes() {
  const queryClient = useQueryClient()
  const { isDark } = useTheme()
  const [search, setSearch] = useState('')
  const [aba, setAba] = useState('ativos')
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  const { data: clients, isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: listClients,
  })

  const { data: inativos = [] } = useQuery({
    queryKey: ['clients-inativos'],
    queryFn: listInactiveClients,
  })

  const createMutation = useMutation({
    mutationFn: async ({ clientData, access }) => {
      // Criar cliente
      const client = await createClient(clientData)

      // Se tipo_cliente é 'recorrente' e tem valor, criar entrada no Financeiro
      if (client.tipo_cliente === 'recorrente' && clientData.valor_servico) {
        try {
          await supabase.from('financial_entries').insert({
            descricao: `Mensalidade - ${client.nome}`,
            tipo: 'entrada',
            categoria: 'servicos',
            valor: parseFloat(clientData.valor_servico),
            status: 'pendente',
            data_vencimento: proximoVencimento(access?.vencimento),
            cliente_id: client.id,
            recorrente: true,
          })
        } catch (error) {
          console.warn('Aviso: não foi possível criar entrada no Financeiro', error)
        }
      }

      // Convite de acesso ao portal (item 4)
      let acessoEnviado = false
      if (access?.ativar && access?.email) {
        await inviteClientUser({ email: access.email, nome: client.nome, clienteId: client.id })
        acessoEnviado = true
      }

      return { client, acessoEnviado }
    },
    onSuccess: ({ acessoEnviado }) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['financial-entries'] })
      setShowForm(false)
      setSuccessMessage(
        acessoEnviado
          ? 'Cliente criado! Link de acesso enviado por e-mail.'
          : 'Cliente criado com sucesso!'
      )
      setTimeout(() => setSuccessMessage(''), 4000)
    },
    onError: (error) => {
      console.error('Erro ao criar cliente:', error)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setDeleteConfirm(null)
      setSuccessMessage('Cliente removido com sucesso!')
      setTimeout(() => setSuccessMessage(''), 3000)
    },
    onError: (error) => {
      console.error('Erro ao deletar cliente:', error)
    }
  })

  const restoreMutation = useMutation({
    mutationFn: restoreClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['clients-inativos'] })
      setSuccessMessage('Cliente reativado!')
      setTimeout(() => setSuccessMessage(''), 3000)
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (id) => archiveClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['clients-inativos'] })
      setSuccessMessage('Cliente movido para ex-clientes.')
      setTimeout(() => setSuccessMessage(''), 3000)
    },
  })

  const filtered = (clients ?? []).filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase())
  )

  const filteredInativos = inativos.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase())
  )

  function handleDelete(client) {
    setDeleteConfirm(client)
  }

  function confirmDelete() {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id)
    }
  }

  return (
    <div>
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-success/10 border border-success/30 px-4 py-3">
          <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
          <p className="text-sm font-normal text-success">{successMessage}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-muted">
            Gerencie seus clientes e suas informações de contato
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-accent text-accent-foreground px-4 py-2 text-xs font-semibold hover:opacity-90 transition-colors"
        >
          <span>+</span>
          <span>Novo cliente</span>
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex rounded-lg border border-border p-0.5 bg-surface">
          {[['ativos', 'Ativos'], ['inativos', 'Ex-clientes']].map(([val, label]) => (
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
              {val === 'inativos' && inativos.length > 0 && (
                <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">
                  {inativos.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="max-w-xs flex-1">
          <Input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela inativos */}
      {aba === 'inativos' && (
        <Table>
          <TableHead>
            <TableRow isHeader>
              <TableHeader>Nome</TableHeader>
              <TableHeader>Segmento</TableHeader>
              <TableHeader>Saída</TableHeader>
              <TableHeader>Motivo</TableHeader>
              <TableHeader className="text-right">Ações</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInativos.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted">
                  Nenhum ex-cliente registrado
                </TableCell>
              </TableRow>
            )}
            {filteredInativos.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium text-foreground">{c.nome}</TableCell>
                <TableCell>{c.segmento || '—'}</TableCell>
                <TableCell>{c.data_saida ? c.data_saida.split('-').reverse().join('/') : '—'}</TableCell>
                <TableCell className="text-muted">{c.motivo_saida || '—'}</TableCell>
                <TableCell className="text-right">
                  <button
                    type="button"
                    onClick={() => restoreMutation.mutate(c.id)}
                    disabled={restoreMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground hover:bg-white/5 transition-colors"
                    title="Reativar cliente"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reativar
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Tabela ativos */}
      {aba === 'ativos' && <Table>
        <TableHead>
          <TableRow isHeader>
            <TableHeader>Nome</TableHeader>
            <TableHeader>Segmento</TableHeader>
            <TableHeader>Tipo</TableHeader>
            <TableHeader>Contato</TableHeader>
            <TableHeader className="text-right">Ações</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted">
                Carregando clientes...
              </TableCell>
            </TableRow>
          )}

          {error && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-danger">
                Erro ao carregar clientes: {error.message}
              </TableCell>
            </TableRow>
          )}

          {!isLoading && filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted">
                Nenhum cliente encontrado
              </TableCell>
            </TableRow>
          )}

          {!isLoading && filtered.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                <Link
                  to={`/admin/clientes/${client.id}`}
                  className="font-bold text-foreground hover:text-neutral-800 hover:text-foreground transition-colors"
                >
                  {client.nome}
                </Link>
              </TableCell>
              <TableCell>
                {client.segmento ? (
                  <span className="text-muted">{client.segmento}</span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={client.tipo_cliente === 'recorrente' ? 'primary' : 'secondary'}>
                  {client.tipo_cliente === 'recorrente' ? 'Recorrente' : 'Avulso'}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted">
                  {client.contato_email || client.contato_telefone || '—'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-3">
                  <Link
                    to={`/admin/clientes/${client.id}`}
                    className="p-1.5 rounded text-muted transition-colors"
                    title="Ver cliente"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Mover "${client.nome}" para ex-clientes?`)) {
                        archiveMutation.mutate(client.id)
                      }
                    }}
                    disabled={archiveMutation.isPending}
                    className="p-1.5 rounded text-muted hover:text-amber-400 transition-colors disabled:opacity-50"
                    title="Mover para ex-clientes"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(client)}
                    className="p-1.5 rounded text-muted transition-colors"
                    title="Remover cliente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>}

      {/* Modal - Novo Cliente */}
      <Modal open={showForm} title="Novo cliente" onClose={() => setShowForm(false)}>
        <ClientForm
          submitting={createMutation.isPending}
          onCancel={() => setShowForm(false)}
          onSubmit={(values, access) => createMutation.mutate({ clientData: values, access })}
        />
        {createMutation.error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/30 px-3 py-2">
            <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
            <p className="text-xs text-danger">{createMutation.error.message}</p>
          </div>
        )}
      </Modal>

      {/* Modal - Confirmar Deleção */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-surface rounded-2xl border border-border p-6 shadow-2xl shadow-black/60">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-900/30 border border-danger/30">
                <AlertCircle className="h-5 w-5 text-danger" />
              </div>
              <h3 className="text-lg font-normal text-foreground">Remover cliente?</h3>
            </div>
            <p className="mb-6 text-sm text-muted">
              Tem certeza que deseja remover <strong className="text-subtle">{deleteConfirm.nome}</strong>? Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-transparent border border-neutral-600 text-subtle text-sm rounded-lg hover:bg-neutral-700/30 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-danger hover:opacity-90 text-foreground text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
