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
      <div className="flex-1 space-y-2 overflow-y-auto px-1 py-2">
        {messagesQuery.isLoading && <p className="text-xs text-gray-400">Carregando...</p>}
        {!messagesQuery.isLoading && messages.length === 0 && (
          <p className="text-xs text-gray-400">Nenhuma mensagem ainda. Envie a primeira!</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.autor_id === currentUser?.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  isMe ? 'bg-brand-500 text-gray-900' : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.mensagem}</p>
                <p
                  className={`mt-1 text-[10px] ${isMe ? 'text-gray-700/70' : 'text-gray-400'}`}
                >
                  {msg.autor?.nome ?? 'Usuário'} · {formatDateTime(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2 border-t border-gray-200 pt-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escreva uma mensagem..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <button
          type="submit"
          disabled={sendMutation.isPending || !message.trim()}
          className="shrink-0 rounded-md bg-brand-500 px-4 py-2 text-sm font-normal text-gray-900 hover:bg-brand-600 disabled:opacity-60"
        >
          Enviar
        </button>
      </form>
      {sendMutation.error && (
        <p className="mt-1 text-xs text-red-600">{sendMutation.error.message}</p>
      )}
    </div>
  )
}
