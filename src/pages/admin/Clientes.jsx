import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabaseClient'
import { createClient, deleteClient, listClients } from '../../lib/api/clients'
import { inviteClientUser } from '../../lib/api/users'
import Modal from '../../components/ui/Modal'
import ClientForm from '../../components/ClientForm'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Table, { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table'

export default function Clientes() {
  const queryClient = useQueryClient()
  const { isDark } = useTheme()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  const { data: clients, isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: listClients,
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
            data_vencimento: new Date().toISOString().split('T')[0],
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
          ? '✅ Cliente criado! Link de acesso enviado por e-mail.'
          : '✅ Cliente criado com sucesso!'
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
      setSuccessMessage('✅ Cliente removido com sucesso!')
      setTimeout(() => setSuccessMessage(''), 3000)
    },
    onError: (error) => {
      console.error('Erro ao deletar cliente:', error)
    }
  })

  const filtered = (clients ?? []).filter((c) =>
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
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-green-900/20 border border-green-700/50 px-4 py-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-sm font-normal text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-normal text-neutral-900 dark:text-white">
            Clientes
          </h1>
          <p className="mt-1 text-xs text-neutral-900 dark:text-neutral-400" style={!isDark ? { color: '#1a1a1a' } : {}}>
            Gerencie seus clientes e suas informações de contato
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-md border border-emerald-400 dark:border-emerald-500/60 text-emerald-600 dark:text-emerald-400 px-4 py-2 text-xs font-normal bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-800/30 transition-colors"
        >
          <span>+</span>
          <span>Novo cliente</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-sm">
        <input
          type="text"
          placeholder="Buscar clientes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-neutral-600 dark:border-neutral-600 bg-transparent dark:bg-transparent text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
        />
      </div>

      {/* Table */}
      <Table>
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
              <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                Carregando clientes...
              </TableCell>
            </TableRow>
          )}

          {error && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-red-600 dark:text-red-400">
                Erro ao carregar clientes: {error.message}
              </TableCell>
            </TableRow>
          )}

          {!isLoading && filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                Nenhum cliente encontrado
              </TableCell>
            </TableRow>
          )}

          {!isLoading && filtered.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                <Link
                  to={`/admin/clientes/${client.id}`}
                  className="font-bold text-neutral-900 dark:text-white hover:text-neutral-800 dark:hover:text-neutral-100 transition-colors"
                >
                  {client.nome}
                </Link>
              </TableCell>
              <TableCell>
                {client.segmento ? (
                  <span className="text-neutral-600 dark:text-neutral-400">{client.segmento}</span>
                ) : (
                  <span className="text-neutral-400">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={client.tipo_cliente === 'recorrente' ? 'primary' : 'secondary'}>
                  {client.tipo_cliente === 'recorrente' ? '🔄 Recorrente' : 'Avulso'}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {client.contato_email || client.contato_telefone || '—'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-3">
                  <Link
                    to={`/admin/clientes/${client.id}`}
                    className="p-1.5 rounded text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/40 transition-colors"
                    title="Ver cliente"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(client)}
                    className="p-1.5 rounded text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/40 transition-colors"
                    title="Remover cliente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Modal - Novo Cliente */}
      <Modal open={showForm} title="Novo cliente" onClose={() => setShowForm(false)}>
        <ClientForm
          submitting={createMutation.isPending}
          onCancel={() => setShowForm(false)}
          onSubmit={(values, access) => createMutation.mutate({ clientData: values, access })}
        />
        {createMutation.error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-900/20 border border-red-700/50 px-3 py-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-400">{createMutation.error.message}</p>
          </div>
        )}
      </Modal>

      {/* Modal - Confirmar Deleção */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-neutral-900 rounded-2xl border border-neutral-700/50 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-900/30 border border-red-700/50">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-lg font-normal text-white">Remover cliente?</h3>
            </div>
            <p className="mb-6 text-sm text-neutral-400">
              Tem certeza que deseja remover <strong className="text-neutral-300">{deleteConfirm.nome}</strong>? Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-transparent border border-neutral-600 text-neutral-300 text-sm rounded-lg hover:bg-neutral-700/30 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
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
