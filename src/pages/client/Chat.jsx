import { useAuth } from '../../context/AuthContext'
import ChatWindow from '../../components/ChatWindow'

export default function ClientChat() {
  const { profile } = useAuth()

  return (
    <div>
      <h1 className="text-2xl font-normal text-white">Chat com a agência</h1>
      <p className="mt-1 text-sm text-neutral-400">Tire dúvidas e converse diretamente com o time</p>

      <div className="mt-6 h-[32rem] glass rounded-2xl p-5">
        <ChatWindow clienteId={profile?.cliente_id} currentUser={profile} />
      </div>
    </div>
  )
}
