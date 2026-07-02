import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Paperclip, Trash2, Loader2, ExternalLink, RefreshCw, GripVertical, EyeOff, Eye, Lock } from 'lucide-react'
import {
  listAttachments,
  uploadAttachment,
  deleteAttachment,
  replaceAttachment,
  setAttachmentInterno,
  updateAttachmentOrders,
} from '../lib/api/attachments'
import ImageLightbox from './ui/ImageLightbox'

function isImagem(att) {
  return /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(att.nome_arquivo || att.arquivo_url || '')
}

export default function DemandAttachments({ demandId, currentUser, onPendingChange }) {
  const fileRef = useRef(null)
  const [uploadInterno, setUploadInterno] = useState(false)
  const pendingRef = useRef(null)
  const pendingInternoRef = useRef(false)
  const replaceRefs = useRef({})
  const [pending, setPending] = useState([]) // [{ file, interno }]
  const [lightbox, setLightbox] = useState(null) // { images, index } | null
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

  const criativos = items.filter((a) => !a.interno)
  const internas  = items.filter((a) => a.interno)

  const imagensCriativos = (localOrder ?? criativos.filter(isImagem).map((a) => a.id))
    .map((id) => criativos.find((a) => a.id === id))
    .filter(Boolean)
    .filter(isImagem)
  const outrosCriativos = criativos.filter((a) => !isImagem(a))
  const imagensInternas = internas.filter(isImagem)
  const outrosInternas  = internas.filter((a) => !isImagem(a))

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['attachments', demandId] })

  const uploadMutation = useMutation({
    mutationFn: async ({ files, interno }) => {
      for (const file of files) {
        await uploadAttachment(demandId, file, currentUser?.id, { interno })
      }
    },
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (att) => deleteAttachment(att),
    onSuccess: invalidate,
  })

  const replaceMutation = useMutation({
    mutationFn: ({ att, file }) => replaceAttachment(att, file),
    onSuccess: invalidate,
  })

  const internoMutation = useMutation({
    mutationFn: ({ att, interno }) => setAttachmentInterno(att.id, interno),
    onSuccess: invalidate,
  })

  const reorderMutation = useMutation({
    mutationFn: (ids) => updateAttachmentOrders(ids),
  })

  function pickFiles(interno) {
    setUploadInterno(interno)
    fileRef.current?.click()
  }

  function handlePick(e) {
    const files = Array.from(e.target.files || [])
    if (files.length) uploadMutation.mutate({ files, interno: uploadInterno })
    e.target.value = ''
  }

  function handleReplace(att, e) {
    const file = e.target.files?.[0]
    if (file) replaceMutation.mutate({ att, file })
    e.target.value = ''
  }

  // Drag-and-drop (apenas criativos — a ordem é o que o cliente vê)
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

    const ids = imagensCriativos.map((a) => a.id)
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

  function abrirLightbox(lista, att) {
    if (draggingId) return
    setLightbox({
      images: lista.map((a) => ({ url: a.arquivo_url, nome: a.nome_arquivo })),
      index: lista.indexOf(att),
    })
  }

  function renderImagem(att, lista, { draggable = false, interno = false }) {
    return (
      <div
        key={att.id}
        draggable={draggable}
        onDragStart={draggable ? (e) => onDragStart(e, att.id) : undefined}
        onDragOver={draggable ? (e) => onDragOver(e, att.id) : undefined}
        onDrop={draggable ? (e) => onDrop(e, att.id) : undefined}
        onDragEnd={draggable ? onDragEnd : undefined}
        className={`group relative aspect-square overflow-hidden rounded-lg border bg-white/5 transition-all
          ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}
          ${draggingId === att.id ? 'opacity-40 scale-95' : ''}
          ${dragOverId === att.id && draggingId !== att.id ? 'border-accent ring-1 ring-accent' : interno ? 'border-dashed border-white/20' : 'border-white/10'}
        `}
      >
        <button
          type="button"
          onClick={() => abrirLightbox(lista, att)}
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

        {/* Ações: mover de seção + substituir + remover */}
        <div className="absolute right-1 top-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => internoMutation.mutate({ att, interno: !interno })}
            disabled={internoMutation.isPending}
            className="rounded-md bg-black/60 p-1 text-subtle hover:text-accent transition-colors disabled:opacity-60"
            title={interno ? 'Mover para criativos (cliente passa a ver)' : 'Mover para referências internas (cliente deixa de ver)'}
          >
            {interno ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
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
    )
  }

  function renderArquivo(att, { interno = false }) {
    return (
      <li
        key={att.id}
        className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${interno ? 'border-dashed border-white/20' : 'border-border'}`}
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
        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => internoMutation.mutate({ att, interno: !interno })}
            disabled={internoMutation.isPending}
            className="p-1.5 rounded text-muted hover:text-accent transition-colors disabled:opacity-60"
            title={interno ? 'Mover para criativos (cliente passa a ver)' : 'Mover para referências internas (cliente deixa de ver)'}
          >
            {interno ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => deleteMutation.mutate(att)}
            disabled={deleteMutation.isPending}
            className="p-1.5 rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-60"
            title="Remover"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </li>
    )
  }

  // ----- Estado sem demandId (nova demanda) -----
  if (!demandId) {
    const pendCriativos = pending.filter((p) => !p.interno)
    const pendInternas  = pending.filter((p) => p.interno)

    const renderPendentes = (lista) => (
      <ul className="space-y-2">
        {lista.map((p) => {
          const idx = pending.indexOf(p)
          return (
            <li key={idx} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2">
              <span className="truncate text-sm text-subtle">{p.file.name}</span>
              <button
                type="button"
                onClick={() => setPending((prev) => prev.filter((_, i) => i !== idx))}
                className="flex-shrink-0 p-1.5 rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                title="Remover"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          )
        })}
      </ul>
    )

    return (
      <div className="space-y-5">
        <input
          ref={pendingRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            const interno = pendingInternoRef.current
            const novos = Array.from(e.target.files || []).map((file) => ({ file, interno }))
            if (novos.length) setPending((p) => [...p, ...novos])
            e.target.value = ''
          }}
        />

        {/* Criativos para aprovação */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-2 text-sm font-normal text-subtle">
              <Paperclip className="w-4 h-4" /> Criativos para aprovação
              <span className="text-[10px] text-muted">visível ao cliente</span>
            </h3>
            <button
              type="button"
              onClick={() => { pendingInternoRef.current = false; pendingRef.current?.click() }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 text-subtle px-3 py-1.5 text-xs font-normal hover:bg-white/5 transition-colors"
            >
              + Adicionar arquivo
            </button>
          </div>
          {pendCriativos.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/15 px-3 py-4 text-center text-xs text-muted">
              Os arquivos serão enviados quando você salvar a demanda.
            </p>
          ) : renderPendentes(pendCriativos)}
        </div>

        {/* Referências internas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-2 text-sm font-normal text-subtle">
              <Lock className="w-4 h-4" /> Referências internas
              <span className="text-[10px] text-muted">só a equipe vê</span>
            </h3>
            <button
              type="button"
              onClick={() => { pendingInternoRef.current = true; pendingRef.current?.click() }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-white/15 text-subtle px-3 py-1.5 text-xs font-normal hover:bg-white/5 transition-colors"
            >
              + Adicionar referência
            </button>
          </div>
          {pendInternas.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/15 px-3 py-4 text-center text-xs text-muted">
              Nenhuma referência interna.
            </p>
          ) : renderPendentes(pendInternas)}
        </div>
      </div>
    )
  }

  // ----- Estado com demandId -----
  return (
    <div className="space-y-6">
      <input ref={fileRef} type="file" multiple onChange={handlePick} className="hidden" />

      {uploadMutation.error && (
        <p className="text-xs text-danger">{uploadMutation.error.message}</p>
      )}

      {/* Criativos para aprovação (visível ao cliente) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 text-sm font-normal text-subtle">
            <Paperclip className="w-4 h-4" /> Criativos para aprovação
            <span className="text-[10px] text-muted">visível ao cliente</span>
          </h3>
          <button
            type="button"
            onClick={() => pickFiles(false)}
            disabled={uploadMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 text-subtle px-3 py-1.5 text-xs font-normal hover:bg-white/5 transition-colors disabled:opacity-60"
          >
            {uploadMutation.isPending && !uploadInterno ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...</>
            ) : (
              <>+ Adicionar arquivo</>
            )}
          </button>
        </div>

        {isLoading ? (
          <p className="text-xs text-muted">Carregando anexos...</p>
        ) : criativos.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted">
            Nenhum criativo anexado.
          </p>
        ) : (
          <div className="space-y-3">
            {imagensCriativos.length > 0 && (
              <>
                {imagensCriativos.length > 1 && (
                  <p className="text-[10px] text-muted flex items-center gap-1">
                    <GripVertical className="w-3 h-3" /> Arraste para reordenar
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {imagensCriativos.map((att) =>
                    renderImagem(att, imagensCriativos, { draggable: true, interno: false })
                  )}
                </div>
              </>
            )}
            {outrosCriativos.length > 0 && (
              <ul className="space-y-2">
                {outrosCriativos.map((att) => renderArquivo(att, { interno: false }))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Referências internas (só equipe) */}
      <div className="rounded-xl border border-dashed border-white/15 p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 text-sm font-normal text-subtle">
            <Lock className="w-4 h-4" /> Referências internas
            <span className="text-[10px] text-muted">só a equipe vê</span>
          </h3>
          <button
            type="button"
            onClick={() => pickFiles(true)}
            disabled={uploadMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-white/15 text-subtle px-3 py-1.5 text-xs font-normal hover:bg-white/5 transition-colors disabled:opacity-60"
          >
            {uploadMutation.isPending && uploadInterno ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...</>
            ) : (
              <>+ Adicionar referência</>
            )}
          </button>
        </div>

        {isLoading ? (
          <p className="text-xs text-muted">Carregando...</p>
        ) : internas.length === 0 ? (
          <p className="px-3 py-3 text-center text-xs text-muted">
            Nenhuma referência interna. Arquivos aqui nunca aparecem para o cliente.
          </p>
        ) : (
          <div className="space-y-3">
            {imagensInternas.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {imagensInternas.map((att) =>
                  renderImagem(att, imagensInternas, { draggable: false, interno: true })
                )}
              </div>
            )}
            {outrosInternas.length > 0 && (
              <ul className="space-y-2">
                {outrosInternas.map((att) => renderArquivo(att, { interno: true }))}
              </ul>
            )}
          </div>
        )}
      </div>

      {lightbox !== null && (
        <ImageLightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
