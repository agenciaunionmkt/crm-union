import { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, ListTodo, Mail, TrendingUp, DollarSign, Sun, Moon, Settings, LogOut, X, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabaseClient'
import UnionLogo from '../components/UnionLogo'
import PhotoCropModal from '../components/PhotoCropModal'

const links = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/clientes', label: 'Clientes', Icon: Users },
  { to: '/admin/demandas', label: 'Demandas', Icon: ListTodo },
  { to: '/admin/solicitacoes', label: 'Solicitações', Icon: Mail },
  { to: '/admin/relatorios', label: 'Relatórios', Icon: TrendingUp },
  { to: '/admin/financeiro', label: 'Financeiro', Icon: DollarSign },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [showSettings, setShowSettings] = useState(false)
  const [userPhoto, setUserPhoto] = useState(null)
  const [cropSrc, setCropSrc] = useState(null)
  const [formData, setFormData] = useState({ nome: '', email: '' })
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const fileInputRef = useRef(null)

  // Sincronizar formData com profile quando modal abre
  useEffect(() => {
    if (showSettings && profile) {
      setFormData({ nome: profile.nome || '', email: profile.email || '' })
      setPasswords({ current: '', new: '', confirm: '' })
      setMessage({ type: '', text: '' })
    }
  }, [showSettings, profile])

  // Carregar foto do localStorage ao montar o componente
  useEffect(() => {
    const savedPhoto = localStorage.getItem('userPhoto')
    if (savedPhoto) {
      setUserPhoto(savedPhoto)
    }
  }, [])

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const photoData = event.target?.result
        if (photoData) setCropSrc(photoData) // abre o cropper
      }
      reader.readAsDataURL(file)
      e.target.value = ''
    }
  }

  const handleCropApply = (croppedDataUrl) => {
    try {
      localStorage.setItem('userPhoto', croppedDataUrl)
      setUserPhoto(croppedDataUrl)
      setMessage({ type: 'success', text: 'Foto atualizada!' })
    } catch {
      setMessage({ type: 'error', text: 'Não foi possível salvar a foto (muito grande).' })
    }
    setCropSrc(null)
  }

  const handleAddPhoto = () => {
    fileInputRef.current?.click()
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSaveProfile = async () => {
    // Validações
    if (!formData.nome.trim()) {
      setMessage({ type: 'error', text: 'Nome é obrigatório' })
      return
    }
    if (formData.nome.trim().length < 3) {
      setMessage({ type: 'error', text: 'Nome deve ter ao menos 3 caracteres' })
      return
    }
    if (!formData.email.trim()) {
      setMessage({ type: 'error', text: 'E-mail é obrigatório' })
      return
    }
    if (!validateEmail(formData.email)) {
      setMessage({ type: 'error', text: 'E-mail inválido' })
      return
    }

    // Verificar se e-mail já existe (de outro usuário)
    if (formData.email !== profile.email) {
      setSaving(true)
      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', formData.email)
          .neq('id', profile.id)
          .maybeSingle()

        if (existingUser) {
          setMessage({ type: 'error', text: 'Este e-mail já está em uso' })
          setSaving(false)
          return
        }
      } catch (error) {
        // Erro esperado se não encontrar
      }
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          nome: formData.nome.trim(),
          email: formData.email.trim(),
        })
        .eq('id', profile.id)

      if (error) throw error
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' })
      setTimeout(() => setShowSettings(false), 1500)
    } catch (error) {
      setMessage({ type: 'error', text: `${error.message || 'Erro ao salvar perfil'}` })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    // Validações
    if (!passwords.new || !passwords.confirm) {
      setMessage({ type: 'error', text: 'Preencha a nova senha e confirmação' })
      return
    }
    if (passwords.new.length < 8) {
      setMessage({ type: 'error', text: 'Senha deve ter no mínimo 8 caracteres' })
      return
    }
    if (!/[A-Z]/.test(passwords.new)) {
      setMessage({ type: 'error', text: 'Senha deve conter pelo menos uma letra maiúscula' })
      return
    }
    if (!/[0-9]/.test(passwords.new)) {
      setMessage({ type: 'error', text: 'Senha deve conter pelo menos um número' })
      return
    }
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'As senhas não conferem' })
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.new })
      if (error) throw error
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' })
      setPasswords({ current: '', new: '', confirm: '' })
      setTimeout(() => setShowSettings(false), 1500)
    } catch (error) {
      setMessage({ type: 'error', text: `${error.message || 'Erro ao alterar senha'}` })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen union-app-bg text-white">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col border-r border-white/10 bg-white/[0.03] backdrop-blur-xl">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/10">
          <UnionLogo size="sm" variant="light" />
          <p className="mt-2 text-xs font-normal text-neutral-400 uppercase tracking-widest opacity-70">
            Admin
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-normal transition-all duration-200 ${
                  isActive
                    ? 'union-active'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <link.Icon className="w-4 h-4" strokeWidth={2} />
              <span className="text-xs">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-white/10">
          <p className="text-xs text-neutral-600">v1.0</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-white/10 bg-white/[0.02] backdrop-blur-xl">
          <div className="flex items-center justify-between px-6 py-3.5">
            <div>
              <p className="text-xs font-normal text-neutral-500 dark:text-neutral-400 uppercase tracking-widest opacity-70">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
            </div>

            <div className="flex items-center gap-3">

              {/* User Info */}
              <div className="text-right">
                <p className="text-xs font-normal text-neutral-900 dark:text-white">
                  {profile?.nome ?? 'Usuário'}
                </p>
                <p className="text-xs capitalize text-neutral-600 dark:text-neutral-400 opacity-70">
                  {profile?.papel ?? 'gestor'}
                </p>
              </div>

              {/* Avatar */}
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt="Foto do perfil"
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0 border-2 border-neutral-700"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 border border-white/10">
                  <Users className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Settings */}
              <button
                onClick={() => setShowSettings(true)}
                className="rounded-md p-2 text-neutral-300 hover:bg-neutral-700/40 transition-colors"
                title="Configurações"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Logout */}
              <button
                onClick={signOut}
                className="rounded-md px-3 py-1.5 text-xs font-normal text-neutral-600 dark:text-neutral-300 border border-neutral-400/50 dark:border-neutral-600 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/40 transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#13101c]/95 backdrop-blur-2xl rounded-2xl border border-white/10 p-8 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-normal text-white">Configurações</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-transparent rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile Section */}
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-widest text-neutral-400">Perfil</p>

                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full border-2 border-neutral-600 flex items-center justify-center bg-transparent overflow-hidden">
                    {userPhoto ? (
                      <img
                        src={userPhoto}
                        alt="Foto do perfil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-10 h-10 text-neutral-400" />
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddPhoto}
                      className="px-4 py-2 bg-transparent border border-neutral-600 text-neutral-300 text-sm rounded-lg hover:bg-neutral-700/30 transition-colors"
                    >
                      {userPhoto ? 'Trocar foto' : 'Adicionar foto'}
                    </button>
                    {userPhoto && (
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.removeItem('userPhoto')
                          setUserPhoto(null)
                        }}
                        className="px-4 py-2 bg-transparent border border-red-700/50 text-red-400 text-sm rounded-lg hover:bg-red-900/20 transition-colors"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>

                {/* Name Field */}
                <div>
                  <label className="text-xs text-neutral-400 mb-2 block">Nome completo</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full bg-transparent border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neutral-600"
                    style={{ transition: 'background-color 5000s ease-in-out 0s' }}
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="text-xs text-neutral-400 mb-2 block">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-transparent border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neutral-600"
                    style={{ transition: 'background-color 5000s ease-in-out 0s' }}
                  />
                </div>

                {/* Role Field */}
                <div>
                  <label className="text-xs text-neutral-400 mb-2 block">Função</label>
                  <input
                    type="text"
                    defaultValue={profile?.papel ?? 'gestor'}
                    className="w-full bg-transparent border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neutral-600" style={{'WebkitBoxShadow': '0 0 0 30px transparent inset', 'WebkitTextFillColor': '#ffffff'}}
                    disabled
                  />
                </div>

                {/* Password Section */}
                <div className="pt-4 border-t border-neutral-700">
                  <p className="text-xs uppercase tracking-widest text-neutral-400 mb-4">Segurança</p>

                  <div>
                    <label className="text-xs text-neutral-400 mb-2 block">Nova senha</label>
                    <input
                      type="password"
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-transparent border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neutral-600"
                      style={{ transition: 'background-color 5000s ease-in-out 0s' }}
                    />
                  </div>

                  <div className="mt-3">
                    <label className="text-xs text-neutral-400 mb-2 block">Confirmar senha</label>
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-transparent border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neutral-600"
                      style={{ transition: 'background-color 5000s ease-in-out 0s' }}
                    />
                  </div>
                </div>
              </div>

              {/* Messages */}
              {message.text && (
                <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                  message.type === 'success'
                    ? 'bg-green-900/20 border-green-700/50'
                    : 'bg-red-900/20 border-red-700/50'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                  <p className={`text-xs ${
                    message.type === 'success' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {message.text}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-transparent border border-neutral-600 text-neutral-300 text-sm rounded-lg hover:bg-neutral-700/30 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar perfil'}
                </button>
                {passwords.new && (
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Alterando...' : 'Alterar senha'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cropper de foto */}
      {cropSrc && (
        <PhotoCropModal
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onApply={handleCropApply}
        />
      )}
    </div>
  )
}
