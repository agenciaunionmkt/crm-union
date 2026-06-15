import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Mail, CheckSquare, MessageSquare, CalendarDays, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import UnionLogo from '../components/UnionLogo'

const links = [
  { to: '/portal/calendario', label: 'Calendário', Icon: CalendarDays },
  { to: '/portal/solicitacoes', label: 'Solicitações', Icon: Mail },
  { to: '/portal/aprovacoes', label: 'Aprovar entregas', Icon: CheckSquare },
  { to: '/portal/chat', label: 'Chat com a agência', Icon: MessageSquare },
]

export default function ClientLayout() {
  const { profile, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen union-app-bg text-white">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-white/10 bg-[#0f0b16] lg:bg-white/[0.03] backdrop-blur-xl transform transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div>
            <UnionLogo size="sm" variant="light" />
            <p className="mt-2 text-xs text-neutral-400 uppercase tracking-widest opacity-70">
              Portal do cliente
            </p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setSidebarOpen(false)}
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

      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="lg:hidden flex items-center gap-3 border-b border-white/10 bg-white/[0.02] backdrop-blur-xl px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-md text-neutral-300 hover:bg-white/10" aria-label="Abrir menu">
            <Menu className="w-5 h-5" />
          </button>
          <UnionLogo size="sm" variant="light" />
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-8 min-w-0">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
