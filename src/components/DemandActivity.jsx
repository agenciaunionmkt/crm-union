import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload, File, Trash2, AlertCircle } from 'lucide-react'
import {
  createComment,
  deleteAttachment,
  deleteComment,
  listAttachments,
  listComments,
  uploadAttachment,
} from '../lib/api/demandActivity'

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR')
}

/**
 * Seção de atividade de uma demanda: comentários + anexos.
 *
 * mode = 'admin'  -> vê e pode marcar comentários internos, pode enviar/excluir anexos
 * mode = 'cliente' -> vê apenas comentários externos, anexos somente leitura
 */
export default function DemandActivity({ demandId, mode = 'admin', currentUser }) {
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const [interno, setInterno] = useState(mode === 'admin')
  const fileInputRef = useRef(null)

  const isAdmin = mode === 'admin'

  const commentsQuery = useQuery({
    queryKey: ['comments', demandId, mode],
    queryFn: () => listComments(demandId, { onlyExternal: !isAdmin }),
    enabled: !!demandId,
  })

  const attachmentsQuery = useQuery({
    queryKey: ['attachments', demandId],
    queryFn: () => listAttachments(demandId),
    enabled: !!demandId,
  })

  const commentMutation = useMutation({
    mutationFn: (payload) => createComment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', demandId] })
      setMessage('')
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', demandId] }),
  })

  const uploadMutation = useMutation({
    mutationFn: (file) => uploadAttachment({ demandId, file, enviadoPor: currentUser?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', demandId] })
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
  })

  const deleteAttachmentMutation = useMutation({
    mutationFn: deleteAttachment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attachments', demandId] }),
  })

  function handleSendComment(e) {
    e.preventDefault()
    if (!message.trim()) return
    commentMutation.mutate({
      demandId,
      autorId: currentUser?.id,
      mensagem: message.trim(),
      interno: isAdmin ? interno : false,
    })
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) uploadMutation.mutate(file)
  }

  const comments = commentsQuery.data ?? []
  const attachments = attachmentsQuery.data ?? []

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAdmin) return
    const files = e.dataTransfer.files
    if (files.length > 0) {
      uploadMutation.mutate(files[0])
    }
  }

  return (
    <div className="space-y-6">
      {/* Comentários */}
      <div>
        <h3 className="mb-4 text-sm font-normal text-neutral-300">
          {isAdmin ? 'Comentários' : 'Conversas com a agência'}
        </h3>

        {commentsQuery.isLoading && (
          <p className="text-xs text-neutral-400">Carregando comentários...</p>
        )}

        {!commentsQuery.isLoading && comments.length === 0 && (
          <div className="text-center py-6 border border-neutral-700/30 rounded-lg bg-neutral-800/20 mb-4">
            <p className="text-xs text-neutral-400">Nenhum comentário ainda</p>
          </div>
        )}

        {comments.length > 0 && (
          <ul className="mb-4 max-h-64 space-y-2 overflow-y-auto">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className={`rounded-lg border px-3 py-2.5 text-sm ${
                  comment.interno
                    ? 'border-yellow-700/50 bg-yellow-900/20'
                    : 'border-neutral-700/50 bg-neutral-800/30'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-normal text-neutral-200">
                      {comment.autor?.nome ?? 'Usuário'}
                    </span>
                    {isAdmin && comment.interno && (
                      <span className="rounded-full bg-yellow-700/50 px-2 py-0.5 text-[10px] font-normal text-yellow-200">
                        Interno
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-500">{formatDateTime(comment.created_at)}</span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => deleteCommentMutation.mutate(comment.id)}
                        disabled={deleteCommentMutation.isPending}
                        className="text-neutral-500 hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Excluir comentário"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-neutral-300">{comment.mensagem}</p>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSendComment} className="flex flex-col gap-3">
          <textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isAdmin ? 'Escreva um comentário...' : 'Escreva uma mensagem para a agência...'}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm font-normal text-neutral-200 placeholder-neutral-500 focus:border-neutral-600 focus:outline-none resize-none"
          />
          <div className="flex items-center justify-between">
            {isAdmin ? (
              <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={interno}
                  onChange={(e) => setInterno(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-600 bg-neutral-700"
                />
                Comentário interno (não visível ao cliente)
              </label>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={commentMutation.isPending || !message.trim()}
              className="rounded-lg bg-yellow-400 px-4 py-2 text-xs font-semibold text-gray-900 hover:bg-yellow-500 disabled:opacity-60 transition-colors"
            >
              {commentMutation.isPending ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
          {commentMutation.error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-900/20 border border-red-700/50 px-3 py-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400">{commentMutation.error.message}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
