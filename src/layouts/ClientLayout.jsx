import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Mail, CheckSquare, MessageSquare, CalendarDays, Menu, X, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { getClient } from '../lib/api/clients'
import { labelDoPlano, postsDoPlano } from '../lib/plans'
import UnionLogo from '../components/UnionLogo'
import Modal from '../components/Modal'

const links = [
  { to: '/portal/calendario', label: 'Calendário', Icon: CalendarDays },
  { to: '/portal/solicitacoes', label: 'Solicitações', Icon: Mail },
  { to: '/portal/aprovacoes', label: 'Aprovar entregas', Icon: CheckSquare },
  { to: '/portal/chat', label: 'Chat com a agência', Icon: MessageSquare },
]

function formatCurrency(value) {
  if (value === null || value === undefined) return '—'
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function ClientLayout() {
  const { profile, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)

  const { data: cliente } = useQuery({
    queryKey: ['clients', profile?.cliente_id],
    queryFn: () => getClient(profile.cliente_id),
    enabled: !!profile?.cliente_id && showConfig,
  })

  async function trocarSenha() {
    setMsg({ type: '', text: '' })
    if (novaSenha.length < 6) {
      setMsg({ type: 'error', text: 'A senha deve ter ao menos 6 caracteres' })
      return
    }
    if (novaSenha !== confirmar) {
      setMsg({ type: 'error', text: 'As senhas não conferem' })
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha })
      if (error) throw error
      setMsg({ type: 'success', text: 'Senha alterada com sucesso!' })
      setNovaSenha('')
      setConfirmar('')
    } catch (e) {
      setMsg({ type: 'error', text: e.message || 'Erro ao alterar senha' })
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20'
  const infoRow = (label, value) => (
    <div className="flex items-center justify-between border-b border-white/5 py-2">
      <span className="text-xs text-neutral-400">{label}</span>
      <span className="text-sm text-white text-right">{value}</span>
    </div>
  )

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
                  isActive ? 'union-active' : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <link.Icon className="w-4 h-4" strokeWidth={2} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 px-4 py-4">
          <p className="truncate px-1 text-sm font-normal text-white">{profile?.nome ?? 'Cliente'}</p>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => { setShowConfig(true); setSidebarOpen(false) }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/5 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" /> Configurações
            </button>
            <button
              onClick={signOut}
              className="text-xs font-normal text-neutral-400 hover:text-yellow-300 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
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

      <Modal open={showConfig} title="Configurações" onClose={() => setShowConfig(false)}>
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-neutral-400">Seus dados</p>
            {infoRow('Nome', cliente?.nome ?? profile?.nome ?? '—')}
            {infoRow('E-mail de acesso', profile?.email ?? '—')}
            {infoRow('E-mail de contato', cliente?.contato_email ?? '—')}
            {infoRow('Plano', cliente?.plano ? labelDoPlano(cliente.plano) : '—')}
            {infoRow('Posts/mês', cliente?.plano ? postsDoPlano(cliente.plano) : '—')}
            {infoRow('Valor', formatCurrency(cliente?.valor_servico))}
            {infoRow('Vencimento', cliente?.dia_vencimento ? `Dia ${cliente.dia_vencimento}` : '—')}
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="mb-3 text-xs uppercase tracking-widest text-neutral-400">Alterar senha</p>
            <div className="space-y-3">
              <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Nova senha" className={inputClass} />
              <input type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} placeholder="Confirmar senha" className={inputClass} />
            </div>
            {msg.text && (
              <p className={`mt-2 text-xs ${msg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={trocarSenha}
                disabled={saving || !novaSenha}
                className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-500 disabled:opacity-60 transition-colors"
              >
                {saving ? 'Salvando...' : 'Alterar senha'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
