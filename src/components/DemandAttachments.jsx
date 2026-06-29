import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Paperclip, Trash2, Loader2, ExternalLink, RefreshCw, GripVertical } from 'lucide-react'
import {
  listAttachments,
  uploadAttachment,
  deleteAttachment,
  replaceAttachment,
  updateAttachmentOrders,
} from '../lib/api/attachments'
import ImageLightbox from './ui/ImageLightbox'

function isImagem(att) {
  return /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(att.nome_arquivo || att.arquivo_url || '')
}

export default function DemandAttachments({ demandId, currentUser, onPendingChange }) {
  const fileRef = useRef(null)
  const pendingRef = useRef(null)
  const replaceRefs = useRef({})
  const [pending, setPending] = useState([])
  const [lightbox, setLightbox] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [localOrder, setLocalOrder] = useState(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (onPendingChange) onPendingChange(pending)
  }, [pending, onPendingChange])

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['attachments', demandId],
    queryFn: () => listAttachments(demandId),
    enabled: !!demandId,
  })

  // Sincroniza ordem local quando dados chegam do servidor
  useEffect(() => {
    setLocalOrder(null)
  }, [items])

  const imagens = (localOrder ?? items.filter(isImagem).map((a) => a.id))
    .map((id) => items.find((a) => a.id === id))
    .filter(Boolean)
    .filter(isImagem)
  const outros = items.filter((a) => !isImagem(a))

  const uploadMutation = useMutation({
    mutationFn: async (files) => {
      for (const file of files) {
        await uploadAttachment(demandId, file, currentUser?.id)
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attachments', demandId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (att) => deleteAttachment(att),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attachments', demandId] }),
  })

  const replaceMutation = useMutation({
    mutationFn: ({ att, file }) => replaceAttachment(att, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attachments', demandId] }),
  })

  const reorderMutation = useMutation({
    mutationFn: (ids) => updateAttachmentOrders(ids),
  })

  function handlePick(e) {
    const files = Array.from(e.target.files || [])
    if (files.length) uploadMutation.mutate(files)
    e.target.value = ''
  }

  function handleReplace(att, e) {
    const file = e.target.files?.[0]
    if (file) replaceMutation.mutate({ att, file })
    e.target.value = ''
  }

  // Drag-and-drop
  function onDragStart(e, id) {
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(id)
  }

  function onDragOver(e, id) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (id !== draggingId) setDragOverId(id)
  }

  function onDrop(e, targetId) {
    e.preventDefault()
    if (!draggingId || draggingId === targetId) return

    const ids = imagens.map((a) => a.id)
    const fromIdx = ids.indexOf(draggingId)
    const toIdx = ids.indexOf(targetId)
    const next = [...ids]
    next.splice(fromIdx, 1)
    next.splice(toIdx, 0, draggingId)

    setLocalOrder(next)
    reorderMutation.mutate(next)
    setDraggingId(null)
    setDragOverId(null)
  }

  function onDragEnd() {
    setDraggingId(null)
    setDragOverId(null)
  }

  // ----- Estado sem demandId (nova demanda) -----
  if (!demandId) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 text-sm font-normal text-subtle">
            <Paperclip className="w-4 h-4" /> Anexos
          </h3>
          <button
            type="button"
            onClick={() => pendingRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 text-subtle px-3 py-1.5 text-xs font-normal hover:bg-white/5 transition-colors"
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
          <p className="rounded-lg border border-dashed border-white/15 px-3 py-4 text-center text-xs text-muted">
            Os arquivos serão enviados quando você salvar a demanda.
          </p>
        ) : (
          <ul className="space-y-2">
            {pending.map((f, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2">
                <span className="truncate text-sm text-subtle">{f.name}</span>
                <button
                  type="button"
                  onClick={() => setPending((p) => p.filter((_, idx) => idx !== i))}
                  className="flex-shrink-0 p-1.5 rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors"
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

  // ----- Estado com demandId -----
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-sm font-normal text-subtle">
          <Paperclip className="w-4 h-4" /> Anexos
        </h3>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploadMutation.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 text-subtle px-3 py-1.5 text-xs font-normal hover:bg-white/5 transition-colors disabled:opacity-60"
        >
          {uploadMutation.isPending ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...</>
          ) : (
            <>+ Adicionar arquivo</>
          )}
        </button>
        <input ref={fileRef} type="file" multiple onChange={handlePick} className="hidden" />
      </div>

      {uploadMutation.error && (
        <p className="mb-2 text-xs text-danger">{uploadMutation.error.message}</p>
      )}

      {isLoading ? (
        <p className="text-xs text-muted">Carregando anexos...</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted">
          Nenhum arquivo anexado.
        </p>
      ) : (
        <div className="space-y-3">
          {/* Imagens com drag-and-drop e substituição */}
          {imagens.length > 0 && (
            <>
              {imagens.length > 1 && (
                <p className="text-[10px] text-muted flex items-center gap-1">
                  <GripVertical className="w-3 h-3" /> Arraste para reordenar
                </p>
              )}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {imagens.map((att) => (
                  <div
                    key={att.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, att.id)}
                    onDragOver={(e) => onDragOver(e, att.id)}
                    onDrop={(e) => onDrop(e, att.id)}
                    onDragEnd={onDragEnd}
                    className={`group relative aspect-square overflow-hidden rounded-lg border bg-white/5 transition-all cursor-grab active:cursor-grabbing
                      ${draggingId === att.id ? 'opacity-40 scale-95' : ''}
                      ${dragOverId === att.id && draggingId !== att.id ? 'border-accent ring-1 ring-accent' : 'border-white/10'}
                    `}
                  >
                    <button
                      type="button"
                      onClick={() => !draggingId && setLightbox(att)}
                      title={att.nome_arquivo}
                      className="h-full w-full"
                    >
                      <img
                        src={att.arquivo_url}
                        alt={att.nome_arquivo || 'anexo'}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </button>

                    {/* Ações: substituir + remover */}
                    <div className="absolute right-1 top-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => replaceRefs.current[att.id]?.click()}
                        disabled={replaceMutation.isPending}
                        className="rounded-md bg-black/60 p-1 text-subtle hover:text-accent transition-colors disabled:opacity-60"
                        title="Substituir imagem"
                      >
                        {replaceMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(att)}
                        disabled={deleteMutation.isPending}
                        className="rounded-md bg-black/60 p-1 text-subtle hover:text-danger transition-colors disabled:opacity-60"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={(el) => { replaceRefs.current[att.id] = el }}
                      onChange={(e) => handleReplace(att, e)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Outros arquivos (não-imagem) */}
          {outros.length > 0 && (
            <ul className="space-y-2">
              {outros.map((att) => (
                <li
                  key={att.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <a
                    href={att.arquivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 items-center gap-2 text-sm text-subtle hover:text-accent transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{att.nome_arquivo || 'arquivo'}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(att)}
                    disabled={deleteMutation.isPending}
                    className="flex-shrink-0 p-1.5 rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-60"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ImageLightbox
        url={lightbox?.arquivo_url}
        nome={lightbox?.nome_arquivo}
        onClose={() => setLightbox(null)}
      />
    </div>
  )
}
