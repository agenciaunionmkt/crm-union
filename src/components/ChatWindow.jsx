import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listMessages, sendMessage } from '../lib/api/chat'

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR')
}

/**
 * Janela de chat entre cliente e agência, vinculada a um cliente específico.
 */
export default function ChatWindow({ clienteId, currentUser }) {
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const bottomRef = useRef(null)

  const messagesQuery = useQuery({
    queryKey: ['chat', clienteId],
    queryFn: () => listMessages(clienteId),
    enabled: !!clienteId,
    refetchInterval: 5000,
  })

  const sendMutation = useMutation({
    mutationFn: (payload) => sendMessage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', clienteId] })
      setMessage('')
    },
  })

  const messages = messagesQuery.data ?? []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  function handleSubmit(e) {
    e.preventDefault()
    if (!message.trim()) return
    sendMutation.mutate({
      clienteId,
      autorId: currentUser?.id,
      mensagem: message.trim(),
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-1 py-2">
        {messagesQuery.isLoading && <p className="text-xs text-neutral-400">Carregando...</p>}
        {!messagesQuery.isLoading && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-neutral-400">Nenhuma mensagem ainda.</p>
            <p className="text-xs text-neutral-500">Envie a primeira mensagem para começar a conversa.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.autor_id === currentUser?.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  isMe
                    ? 'bg-yellow-400 text-gray-900 rounded-br-sm'
                    : 'bg-white/8 text-neutral-100 border border-white/10 rounded-bl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.mensagem}</p>
                <p className={`mt-1 text-[10px] ${isMe ? 'text-gray-800/70' : 'text-neutral-500'}`}>
                  {msg.autor?.nome ?? 'Usuário'} · {formatDateTime(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2 border-t border-white/10 pt-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escreva uma mensagem..."
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
        />
        <button
          type="submit"
          disabled={sendMutation.isPending || !message.trim()}
          className="shrink-0 rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-yellow-500 disabled:opacity-60 transition-colors"
        >
          Enviar
        </button>
      </form>
      {sendMutation.error && (
        <p className="mt-1 text-xs text-red-400">{sendMutation.error.message}</p>
      )}
    </div>
  )
}
