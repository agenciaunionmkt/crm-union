import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Sparkles, Loader2 } from 'lucide-react'
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
  const isAgency = currentUser?.papel && currentUser.papel !== 'cliente'
  const [suggesting, setSuggesting] = useState(false)

  async function sugerirResposta() {
    if (suggesting || messages.length === 0) return
    setSuggesting(true)
    try {
      const conversa = messages
        .slice(-8)
        .map((m) => `${m.autor?.papel === 'cliente' ? 'Cliente' : 'Agência'}: ${m.mensagem}`)
        .join('\n')
      const prompt =
        'Você é o atendimento de uma agência de marketing conversando com um cliente. ' +
        'Com base na conversa abaixo, sugira a próxima resposta da agência: cordial, objetiva e em português do Brasil. ' +
        'Responda apenas com o texto da mensagem, sem aspas e sem rótulos.\n\n' +
        conversa
      const res = await fetch('/api/assistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      if (res.ok && data.texto) setMessage(data.texto)
    } catch {
      /* ignore */
    } finally {
      setSuggesting(false)
    }
  }

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
        {isAgency && (
          <button
            type="button"
            onClick={sugerirResposta}
            disabled={suggesting || messages.length === 0}
            title="Sugerir resposta com IA"
            className="shrink-0 inline-flex items-center justify-center rounded-lg border border-white/15 px-2.5 py-2.5 text-neutral-300 hover:bg-white/5 disabled:opacity-50 transition-colors"
          >
            {suggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </button>
        )}
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
