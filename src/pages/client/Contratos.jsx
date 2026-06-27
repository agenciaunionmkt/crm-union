import { useAuth } from '../../context/AuthContext'
import ContractsPanel from '../../components/ContractsPanel'

export default function Contratos() {
  const { profile } = useAuth()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Contratos</h1>
        <p className="mt-1 text-sm text-muted">
          Seus contratos com a agência. Clique em assinar para concluir pelo Autentique.
        </p>
      </div>

      <div className="glass rounded-2xl p-6">
        <ContractsPanel clienteId={profile?.cliente_id} currentUser={profile} mode="client" />
      </div>
    </div>
  )
}
