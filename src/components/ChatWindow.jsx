import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Sparkles, Loader2, Paperclip, ExternalLink } from 'lucide-react'
import { listMessages, sendMessage } from '../lib/api/chat'
import { notifyTeam } from '../lib/api/notifications'
import { uploadPublicFile, isImageUrl } from '../lib/api/storage'
import EmojiPicker from './ui/EmojiPicker'

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
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const listRef = useRef(null)

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
      // Se quem enviou foi o cliente, notifica a equipe
      if (currentUser?.papel === 'cliente') {
        notifyTeam({
          titulo: 'Nova mensagem de cliente',
          mensagem: `${currentUser?.nome ?? 'Cliente'} enviou uma mensagem`,
          link: '/admin/mensagens',
        }).catch(() => {})
      }
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
    // Rola só a lista de mensagens (não a página inteira)
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
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

  async function handlePickFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const { url, nome } = await uploadPublicFile(file, `chat/${clienteId}`)
      sendMutation.mutate({
        clienteId,
        autorId: currentUser?.id,
        mensagem: message.trim(),
        arquivoUrl: url,
        nomeArquivo: nome,
      })
    } catch (err) {
      alert(err.message || 'Falha ao enviar arquivo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-1 py-2">
        {messagesQuery.isLoading && <p className="text-xs text-muted">Carregando...</p>}
        {!messagesQuery.isLoading && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-muted">Nenhuma mensagem ainda.</p>
            <p className="text-xs text-muted">Envie a primeira mensagem para começar a conversa.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.autor_id === currentUser?.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  isMe
                    ? 'bg-accent text-accent-foreground rounded-br-sm'
                    : 'bg-white/8 text-foreground border border-white/10 rounded-bl-sm'
                }`}
              >
                {msg.mensagem && <p className="whitespace-pre-wrap">{msg.mensagem}</p>}
                {msg.arquivo_url && (
                  isImageUrl(msg.nome_arquivo || msg.arquivo_url) ? (
                    <a href={msg.arquivo_url} target="_blank" rel="noopener noreferrer" className={msg.mensagem ? 'mt-2 block' : 'block'}>
                      <img
                        src={msg.arquivo_url}
                        alt={msg.nome_arquivo || 'anexo'}
                        className="max-h-48 w-auto rounded-lg border border-black/10"
                      />
                    </a>
                  ) : (
                    <a
                      href={msg.arquivo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 underline ${msg.mensagem ? 'mt-2' : ''} ${isMe ? 'text-gray-900' : 'text-accent'}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {msg.nome_arquivo || 'arquivo'}
                    </a>
                  )
                )}
                <p className={`mt-1 text-[10px] ${isMe ? 'text-gray-800/70' : 'text-muted'}`}>
                  {msg.autor?.nome ?? 'Usuário'} · {formatDateTime(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2 border-t border-white/10 pt-3">
        {isAgency && (
          <button
            type="button"
            onClick={sugerirResposta}
            disabled={suggesting || messages.length === 0}
            title="Sugerir resposta com IA"
            className="shrink-0 inline-flex items-center justify-center rounded-lg border border-white/15 px-2.5 py-2.5 text-subtle hover:bg-white/5 disabled:opacity-50 transition-colors"
          >
            {suggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </button>
        )}
        <EmojiPicker onSelect={(e) => setMessage((m) => m + e)} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          title="Anexar arquivo"
          className="shrink-0 inline-flex items-center justify-center rounded-lg border border-white/15 px-2.5 py-2.5 text-subtle hover:bg-white/5 disabled:opacity-60 transition-colors"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={handlePickFile} />
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escreva uma mensagem..."
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
        />
        <button
          type="submit"
          disabled={sendMutation.isPending || !message.trim()}
          className="shrink-0 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-gray-900 hover:opacity-90 disabled:opacity-60 transition-colors"
        >
          Enviar
        </button>
      </form>
      {sendMutation.error && (
        <p className="mt-1 text-xs text-danger">{sendMutation.error.message}</p>
      )}
    </div>
  )
}
