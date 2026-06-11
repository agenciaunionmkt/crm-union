import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UnionLogo from '../components/UnionLogo'

const links = [
  { to: '/portal', label: 'Cronograma do mês', end: true },
  { to: '/portal/demandas', label: 'Status das demandas' },
  { to: '/portal/aprovacoes', label: 'Aprovar entregas' },
  { to: '/portal/solicitacoes', label: 'Nova solicitação' },
  { to: '/portal/historico', label: 'Histórico de entregas' },
  { to: '/portal/chat', label: 'Chat com a agência' },
]

export default function ClientLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-60 flex-col border-r border-gray-200 bg-white">
        <div className="px-5 py-5">
          <UnionLogo size="sm" />
          <p className="mt-2 text-xs text-gray-500">Portal do cliente</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-gray-900 text-brand-400'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-200 px-5 py-4">
          <p className="truncate text-sm font-medium text-gray-900">
            {profile?.nome ?? 'Cliente'}
          </p>
          <button
            onClick={signOut}
            className="mt-3 text-xs font-medium text-gray-500 hover:text-brand-600"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}
