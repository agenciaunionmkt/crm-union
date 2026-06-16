import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Paperclip, Trash2, Loader2, ExternalLink } from 'lucide-react'
import { listAttachments, uploadAttachment, deleteAttachment } from '../lib/api/attachments'

function isImagem(att) {
  return /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(att.nome_arquivo || att.arquivo_url || '')
}

export default function DemandAttachments({ demandId, currentUser, onPendingChange }) {
  const fileRef = useRef(null)
  const pendingRef = useRef(null)
  const [pending, setPending] = useState([])
  const queryClient = useQueryClient()

  useEffect(() => {
    if (onPendingChange) onPendingChange(pending)
  }, [pending, onPendingChange])

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['attachments', demandId],
    queryFn: () => listAttachments(demandId),
    enabled: !!demandId,
  })

  const uploadMutation = useMutation({
    mutationFn: (file) => uploadAttachment(demandId, file, currentUser?.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attachments', demandId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (att) => deleteAttachment(att),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attachments', demandId] }),
  })

  function handlePick(e) {
    const file = e.target.files?.[0]
    if (file) uploadMutation.mutate(file)
    e.target.value = ''
  }

  const imagens = items.filter(isImagem)
  const outros = items.filter((a) => !isImagem(a))

  if (!demandId) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 text-sm font-normal text-neutral-300">
            <Paperclip className="w-4 h-4" /> Anexos
          </h3>
          <button
            type="button"
            onClick={() => pendingRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 text-neutral-200 px-3 py-1.5 text-xs font-normal hover:bg-white/5 transition-colors"
          >
            + Adicionar arquivo
          </button>
          <input
            ref={pendingRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const novos = Array.from(e.target.files || [])
              if (novos.length) setPending((p) => [...p, ...novos])
              e.target.value = ''
            }}
          />
        </div>
        {pending.length === 0 ? (
          <p className="rounded-lg border border-dashed border-white/15 px-3 py-4 text-center text-xs text-neutral-400">
            Os arquivos serão enviados quando você salvar a demanda.
          </p>
        ) : (
          <ul className="space-y-2">
            {pending.map((f, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2">
                <span className="truncate text-sm text-neutral-300">{f.name}</span>
                <button
                  type="button"
                  onClick={() => setPending((p) => p.filter((_, idx) => idx !== i))}
                  className="flex-shrink-0 p-1.5 rounded text-neutral-400 hover:text-red-500 hover:bg-red-900/20 transition-colors"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-sm font-normal text-neutral-700 dark:text-neutral-300">
          <Paperclip className="w-4 h-4" /> Anexos
        </h3>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploadMutation.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 text-neutral-200 px-3 py-1.5 text-xs font-normal hover:bg-white/5 transition-colors disabled:opacity-60"
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...
            </>
          ) : (
            <>+ Adicionar arquivo</>
          )}
        </button>
        <input ref={fileRef} type="file" onChange={handlePick} className="hidden" />
      </div>

      {uploadMutation.error && (
        <p className="mb-2 text-xs text-red-500">{uploadMutation.error.message}</p>
      )}

      {isLoading ? (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Carregando anexos...</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 px-3 py-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
          Nenhum arquivo anexado.
        </p>
      ) : (
        <div className="space-y-3">
          {/* Imagens em miniatura */}
          {imagens.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {imagens.map((att) => (
                <div
                  key={att.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5"
                >
                  <a href={att.arquivo_url} target="_blank" rel="noopener noreferrer" title={att.nome_arquivo}>
                    <img
                      src={att.arquivo_url}
                      alt={att.nome_arquivo || 'anexo'}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  </a>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(att)}
                    disabled={deleteMutation.isPending}
                    className="absolute right-1 top-1 rounded-md bg-black/60 p-1 text-neutral-200 opacity-0 hover:text-red-400 group-hover:opacity-100 transition-opacity disabled:opacity-60"
                    title="Remover anexo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Outros arquivos (não-imagem) */}
          {outros.length > 0 && (
            <ul className="space-y-2">
              {outros.map((att) => (
                <li
                  key={att.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2"
                >
                  <a
                    href={att.arquivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 hover:text-yellow-300 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{att.nome_arquivo || 'arquivo'}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(att)}
                    disabled={deleteMutation.isPending}
                    className="flex-shrink-0 p-1.5 rounded text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-60"
                    title="Remover anexo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
