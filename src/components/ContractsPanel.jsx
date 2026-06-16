import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, ExternalLink, Upload, RefreshCw, Copy, Check, Trash2 } from 'lucide-react'
import { listContracts, createContract, deleteContract, refreshContractLink } from '../lib/api/contracts'
import Input from './ui/Input'

const statusStyles = {
  enviado: 'bg-yellow-400/15 text-yellow-300',
  assinado: 'bg-emerald-500/20 text-emerald-300',
  recusado: 'bg-red-500/20 text-red-300',
}
const statusLabels = {
  enviado: 'Aguardando assinatura',
  assinado: 'Assinado',
  recusado: 'Recusado',
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('pt-BR')
}

export default function ContractsPanel({ clienteId, defaultEmail = '', currentUser, mode = 'admin' }) {
  const queryClient = useQueryClient()
  const isAdmin = mode === 'admin'

  const [titulo, setTitulo] = useState('')
  const [signerEmail, setSignerEmail] = useState(defaultEmail)
  const [file, setFile] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  function copiarLink(c) {
    navigator.clipboard?.writeText(c.link_assinatura).then(() => {
      setCopiedId(c.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const contractsQuery = useQuery({
    queryKey: ['contratos', clienteId],
    queryFn: () => listContracts(clienteId),
    enabled: !!clienteId,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createContract({ clienteId, titulo, signerEmail, file, createdBy: currentUser?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos', clienteId] })
      setTitulo('')
      setFile(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteContract,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contratos', clienteId] }),
  })

  const refreshMutation = useMutation({
    mutationFn: refreshContractLink,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contratos', clienteId] }),
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!titulo.trim() || !signerEmail.trim() || !file) return
    createMutation.mutate()
  }

  const contratos = contractsQuery.data ?? []

  return (
    <div>
      {isAdmin && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Título do contrato"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Contrato de prestação de serviços"
            />
            <Input
              label="E-mail do signatário"
              type="email"
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
              placeholder="cliente@empresa.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-normal text-neutral-300">Arquivo (PDF)</label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-neutral-300 hover:bg-white/10 transition-colors">
              <Upload className="w-4 h-4" />
              <span className="truncate">{file ? file.name : 'Selecionar PDF do contrato'}</span>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={createMutation.isPending || !titulo.trim() || !signerEmail.trim() || !file}
              className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending ? 'Enviando...' : 'Enviar contrato'}
            </button>
            {createMutation.error && (
              <span className="text-xs text-red-400">{createMutation.error.message}</span>
            )}
          </div>
        </form>
      )}

      <div className={isAdmin ? 'mt-6' : ''}>
        {contractsQuery.isLoading && <p className="text-sm text-neutral-400">Carregando contratos...</p>}

        {!contractsQuery.isLoading && contratos.length === 0 && (
          <p className="text-sm text-neutral-400">
            {isAdmin ? 'Nenhum contrato enviado ainda.' : 'Você não tem contratos no momento.'}
          </p>
        )}

        {isAdmin && refreshMutation.error && (
          <p className="mb-2 text-xs text-red-400">{refreshMutation.error.message}</p>
        )}

        <div className="space-y-2">
          {contratos.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3"
            >
              <FileText className="w-5 h-5 flex-shrink-0 text-neutral-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-normal text-white">{c.titulo}</p>
                <p className="text-xs text-neutral-500">
                  {c.signed_at ? `Assinado em ${formatDate(c.signed_at)}` : `Enviado em ${formatDate(c.created_at)}`}
                </p>
              </div>

              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[c.status]}`}>
                {statusLabels[c.status]}
              </span>

              {/* Cliente assina; admin acompanha o documento assinado */}
              {!isAdmin && c.status === 'enviado' && c.link_assinatura && (
                <a
                  href={c.link_assinatura}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-yellow-500 transition-colors"
                >
                  Assinar <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {c.status === 'assinado' && c.arquivo_url && (
                <a
                  href={c.arquivo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-normal text-neutral-200 hover:bg-white/5 transition-colors"
                >
                  Ver PDF <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {/* Admin: gera o link (fallback) ou copia para enviar ao cliente */}
              {isAdmin && c.status === 'enviado' && !c.link_assinatura && (
                <button
                  type="button"
                  onClick={() => refreshMutation.mutate(c.id)}
                  disabled={refreshMutation.isPending && refreshMutation.variables === c.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-3 py-1.5 text-xs font-medium text-yellow-300 hover:bg-yellow-400/20 disabled:opacity-60 transition-colors"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${refreshMutation.isPending && refreshMutation.variables === c.id ? 'animate-spin' : ''}`}
                  />
                  {refreshMutation.isPending && refreshMutation.variables === c.id ? 'Gerando...' : 'Gerar link'}
                </button>
              )}

              {isAdmin && c.status === 'enviado' && c.link_assinatura && (
                <button
                  type="button"
                  onClick={() => copiarLink(c)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-normal text-neutral-200 hover:bg-white/5 transition-colors"
                >
                  {copiedId === c.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copiar link
                    </>
                  )}
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Remover o contrato "${c.titulo}" do painel?`)) {
                      deleteMutation.mutate(c.id)
                    }
                  }}
                  title="Remover do painel"
                  aria-label="Remover do painel"
                  className="rounded-lg p-1.5 text-neutral-500 hover:bg-white/5 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
