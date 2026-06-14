import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { listClients } from '../../lib/api/clients'
import ChatWindow from '../../components/ChatWindow'

export default function AdminChat() {
  const { profile } = useAuth()
  const { data: clients = [], isLoading } = useQuery({ queryKey: ['clients'], queryFn: listClients })
  const [selectedId, setSelectedId] = useState(null)
  const current = clients.find((c) => c.id === selectedId) || clients[0] || null

  return (
    <div>
      <h1 className="text-2xl font-normal text-white">Mensagens</h1>
      <p className="mt-1 text-sm text-neutral-400">Converse com os clientes da agência</p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 h-[34rem]">
        {/* Lista de clientes */}
        <div className="glass rounded-2xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-white/10 text-xs uppercase tracking-widest text-neutral-400">
            Clientes
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading && <p className="p-4 text-sm text-neutral-400">Carregando...</p>}
            {!isLoading && clients.length === 0 && (
              <p className="p-4 text-sm text-neutral-400">Nenhum cliente cadastrado.</p>
            )}
            {clients.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left px-4 py-3 border-b border-white/5 transition-colors ${
                  current?.id === c.id ? 'union-active' : 'text-neutral-300 hover:bg-white/5'
                }`}
              >
                <p className="text-sm font-normal truncate">{c.nome}</p>
                {c.segmento && <p className="text-xs text-neutral-500 truncate">{c.segmento}</p>}
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
                <ChatWindow clienteId={current.id} currentUser={profile} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">
              Selecione um cliente para conversar
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
