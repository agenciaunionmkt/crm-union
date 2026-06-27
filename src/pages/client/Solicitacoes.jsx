import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Paperclip, ExternalLink, X, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { createClientRequest, listClientRequestsByClient } from '../../lib/api/requests'
import { uploadPublicFile } from '../../lib/api/storage'
import EmojiPicker from '../../components/ui/EmojiPicker'
import { requestStatusLabels as statusLabels, requestStatusStyles as statusStyles } from '../../lib/status'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR')
}

export default function ClientSolicitacoes() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [arquivo, setArquivo] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const requestsQuery = useQuery({
    queryKey: ['client_requests', profile?.cliente_id],
    queryFn: () => listClientRequestsByClient(profile.cliente_id),
    enabled: !!profile?.cliente_id,
  })

  const createMutation = useMutation({
    mutationFn: (payload) => createClientRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client_requests', profile?.cliente_id] })
      setTitulo('')
      setDescricao('')
      setArquivo(null)
    },
  })

  const semVinculo = !profile?.cliente_id

  async function handleSubmit(e) {
    e.preventDefault()
    if (semVinculo) return
    let anexo = { url: null, nome: null }
    if (arquivo) {
      setUploading(true)
      try {
        const r = await uploadPublicFile(arquivo, `solicitacoes/${profile.cliente_id}`)
        anexo = r
      } catch (err) {
        setUploading(false)
        alert(err.message || 'Falha ao anexar arquivo')
        return
      }
      setUploading(false)
    }
    createMutation.mutate({
      cliente_id: profile.cliente_id,
      criado_por: profile.id,
      titulo,
      descricao,
      arquivo_url: anexo.url,
      nome_arquivo: anexo.nome,
    })
  }

  const requests = requestsQuery.data ?? []
  const inputClass =
    'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20'

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight text-foreground">Nova solicitação</h1>
      <p className="mt-1 text-sm text-muted">Envie um novo pedido para a agência</p>

      {semVinculo && (
        <div className="mt-4 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent/80">
          Sua conta ainda não está vinculada a um cliente. Avise a agência para liberar o envio de solicitações.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 max-w-xl glass rounded-2xl p-6">
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-normal text-subtle">Título</label>
          <input
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className={inputClass}
            placeholder="Ex: Criar post para promoção de fim de semana"
          />
        </div>
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm font-normal text-subtle">Descrição</label>
            <EmojiPicker openUp={false} onSelect={(e) => setDescricao((d) => d + e)} />
          </div>
          <textarea
            rows={3}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className={`${inputClass} resize-none`}
            placeholder="Conte mais detalhes sobre o que você precisa"
          />
        </div>

        {/* Anexo */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-normal text-subtle">Anexo (opcional)</label>
          {arquivo ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <span className="truncate text-sm text-subtle">{arquivo.name}</span>
              <button
                type="button"
                onClick={() => setArquivo(null)}
                className="flex-shrink-0 rounded p-1 text-muted hover:text-red-400"
                title="Remover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-2.5 text-sm text-subtle hover:bg-white/10 transition-colors"
            >
              <Paperclip className="w-4 h-4" /> Anexar arquivo (imagem, material...)
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) setArquivo(f)
              e.target.value = ''
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending || uploading || semVinculo}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-gray-900 hover:opacity-90 disabled:opacity-60 transition-colors"
          >
            {uploading ? 'Anexando...' : createMutation.isPending ? 'Enviando...' : 'Enviar solicitação'}
          </button>
          {createMutation.isSuccess && (
            <span className="text-xs text-emerald-400">Solicitação enviada.</span>
          )}
          {createMutation.error && (
            <span className="text-xs text-red-400">{createMutation.error.message}</span>
          )}
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-sm font-normal uppercase tracking-widest text-muted">Suas solicitações</h2>
        <div className="mt-3 glass rounded-2xl overflow-hidden">
          {requestsQuery.isLoading && <p className="p-6 text-sm text-muted">Carregando...</p>}
          {!requestsQuery.isLoading && requests.length === 0 && (
            <p className="p-6 text-sm text-muted">Você ainda não enviou nenhuma solicitação.</p>
          )}
          {requests.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-normal">Solicitação</th>
                  <th className="px-4 py-3 font-normal">Enviado em</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-black tracking-tight text-foreground">{request.titulo}</p>
                      {request.descricao && (
                        <p className="mt-1 max-w-md text-xs text-muted">{request.descricao}</p>
                      )}
                      {request.arquivo_url && (
                        <a
                          href={request.arquivo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent/80"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {request.nome_arquivo || 'anexo'}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(request.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-normal ${statusStyles[request.status]}`}>
                        {statusLabels[request.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
