import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { listConversations } from '../../lib/api/chat'
import ChatWindow from '../../components/ChatWindow'

function formatWhen(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function AdminChat() {
  const { profile } = useAuth()
  const { data: conversas = [], isLoading } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: listConversations,
    refetchInterval: 15000,
  })
  const [selectedId, setSelectedId] = useState(null)
  const current = conversas.find((c) => c.cliente_id === selectedId) || conversas[0] || null

  // Marca as mensagens como vistas ao abrir a tela (zera a notificação)
  useEffect(() => {
    localStorage.setItem('chatLastSeen', new Date().toISOString())
  }, [conversas])

  return (
    <div>
      <h1 className="text-2xl font-normal text-white">Mensagens</h1>
      <p className="mt-1 text-sm text-neutral-400">Conversas iniciadas pelos clientes</p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 h-[34rem]">
        {/* Lista de conversas */}
        <div className="glass rounded-2xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-white/10 text-xs uppercase tracking-widest text-neutral-400">
            Conversas
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading && <p className="p-4 text-sm text-neutral-400">Carregando...</p>}
            {!isLoading && conversas.length === 0 && (
              <p className="p-4 text-sm text-neutral-400">Nenhuma conversa ainda.</p>
            )}
            {conversas.map((c) => (
              <button
                key={c.cliente_id}
                onClick={() => setSelectedId(c.cliente_id)}
                className={`w-full text-left px-4 py-3 border-b border-white/5 transition-colors ${
                  current?.cliente_id === c.cliente_id ? 'union-active' : 'text-neutral-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-normal truncate">{c.nome}</p>
                  <span className="text-[10px] text-neutral-500 flex-shrink-0">{formatWhen(c.ultimaData)}</span>
                </div>
                <p className="text-xs text-neutral-500 truncate">
                  {c.ultimoAutorPapel === 'cliente' ? '' : 'Você: '}{c.ultimaMensagem}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Janela de conversa */}
        <div className="glass rounded-2xl p-5 flex flex-col">
          {current ? (
            <>
              <div className="mb-3 pb-3 border-b border-white/10">
                <p className="text-sm font-normal text-white">{current.nome}</p>
                <p className="text-xs text-neutral-500">{current.contato_email || 'sem e-mail'}</p>
              </div>
              <div className="flex-1 min-h-0">
                <ChatWindow clienteId={current.cliente_id} currentUser={profile} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">
              Quando um cliente enviar uma mensagem, a conversa aparece aqui.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
