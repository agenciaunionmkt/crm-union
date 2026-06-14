import { NavLink, Outlet } from 'react-router-dom'
import { Mail, CheckSquare, MessageSquare } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import UnionLogo from '../components/UnionLogo'

const links = [
  { to: '/portal/solicitacoes', label: 'Solicitações', Icon: Mail },
  { to: '/portal/aprovacoes', label: 'Aprovar entregas', Icon: CheckSquare },
  { to: '/portal/chat', label: 'Chat com a agência', Icon: MessageSquare },
]

export default function ClientLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="flex min-h-screen union-app-bg text-white">
      <aside className="flex w-60 flex-col border-r border-white/10 bg-white/[0.03] backdrop-blur-xl">
        <div className="px-5 py-5 border-b border-white/10">
          <UnionLogo size="sm" variant="light" />
          <p className="mt-2 text-xs text-neutral-400 uppercase tracking-widest opacity-70">
            Portal do cliente
          </p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-normal transition-all duration-200 ${
                  isActive
                    ? 'union-active'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <link.Icon className="w-4 h-4" strokeWidth={2} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 px-5 py-4">
          <p className="truncate text-sm font-normal text-white">
            {profile?.nome ?? 'Cliente'}
          </p>
          <button
            onClick={signOut}
            className="mt-3 text-xs font-normal text-neutral-400 hover:text-yellow-300 transition-colors"
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
