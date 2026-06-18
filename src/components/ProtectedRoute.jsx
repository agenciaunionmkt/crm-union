import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Protege rotas verificando se há sessão ativa e, opcionalmente,
 * se o perfil do usuário (papel) está entre os permitidos.
 *
 * allowedRoles: array de strings, ex: ['admin', 'equipe']
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Carregando...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles) {
    // Exige perfil válido com papel permitido. Sessão sem perfil (ex.: signup
    // direto pela API, sem linha em users) NÃO acessa áreas protegidas.
    if (!profile || !allowedRoles.includes(profile.papel)) {
      const fallback = profile?.papel === 'cliente' ? '/portal' : '/login'
      return <Navigate to={fallback} replace />
    }
  }

  return <Outlet />
}
