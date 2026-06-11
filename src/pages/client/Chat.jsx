import { useAuth } from '../../context/AuthContext'
import ChatWindow from '../../components/ChatWindow'

export default function ClientChat() {
  const { profile } = useAuth()

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Chat com a agência</h1>
      <p className="mt-1 text-sm text-gray-500">Tire dúvidas e converse diretamente com o time</p>

      <div className="mt-6 h-[28rem] rounded-xl border border-gray-200 bg-white p-5">
        <ChatWindow clienteId={profile?.cliente_id} currentUser={profile} />
      </div>
    </div>
  )
}
