import { useAuth } from '../../context/AuthContext'
import MateriaisPanel from '../../components/MateriaisPanel'

export default function ClientMateriais() {
  const { profile } = useAuth()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Materiais</h1>
        <p className="mt-1 text-sm text-muted">
          Envie seu logo, fotos, PDFs e outros materiais para a equipe usar nos seus conteúdos.
        </p>
      </div>

      <div className="glass rounded-2xl p-6">
        <MateriaisPanel clienteId={profile?.cliente_id} currentUser={profile} />
      </div>
    </div>
  )
}
