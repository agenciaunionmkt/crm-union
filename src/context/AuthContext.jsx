import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  // Guarda o id do usuário cujo perfil já foi carregado, para não recarregar
  // (nem mostrar "Carregando") a cada refresh de token ao focar a janela.
  const loadedUserId = useRef(null)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session?.user) {
        loadProfile(data.session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
      }

      setSession(newSession)

      if (!newSession?.user) {
        setProfile(null)
        loadedUserId.current = null
        setLoading(false)
        return
      }

      // Só recarrega o perfil quando o usuário realmente muda (login novo).
      // Em TOKEN_REFRESHED / foco da janela, mantém o que já está — sem desmontar a tela.
      if (loadedUserId.current !== newSession.user.id) {
        loadProfile(newSession.user.id)
      }
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function loadProfile(userId) {
    setLoading(true)
    const { data, error } = await supabase
      .from('users')
      .select('id, nome, email, papel, cliente_id')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Erro ao carregar perfil do usuário:', error.message)
      setProfile(null)
      loadedUserId.current = null
    } else {
      setProfile(data)
      loadedUserId.current = userId
    }
    setLoading(false)
  }

async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error }
}  
  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    return { error }
  }

  async function sendPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    return { error }
  }

  async function updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password })
    if (!error) setPasswordRecovery(false)
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
    setPasswordRecovery(false)
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    passwordRecovery,
    signIn,
    signInWithGoogle,
    sendPasswordReset,
    updatePassword,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  return ctx
}
