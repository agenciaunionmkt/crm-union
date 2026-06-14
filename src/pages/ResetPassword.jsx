import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import UnionLogo from '../components/UnionLogo'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let resolved = false

    const liberar = () => {
      if (resolved) return
      resolved = true
      setIsLoading(false)
    }

    // O link de recuperação é processado de forma assíncrona pelo supabase-js,
    // que dispara PASSWORD_RECOVERY (ou SIGNED_IN) quando a sessão é criada.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        liberar()
      }
    })

    // Caso a sessão já exista quando a página monta.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) liberar()
    })

    // Fallback: se em alguns segundos nenhuma sessão de recuperação surgir,
    // o link é inválido/expirado — volta para solicitar um novo.
    const timeout = setTimeout(() => {
      if (!resolved) navigate('/esqueci-senha', { replace: true })
    }, 4000)

    return () => {
      clearTimeout(timeout)
      listener.subscription.unsubscribe()
    }
  }, [navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (password.length < 6) {
        setError('Senha deve ter pelo menos 6 caracteres')
        setLoading(false)
        return
      }

      if (password !== confirmPassword) {
        setError('As senhas não coincidem')
        setLoading(false)
        return
      }

      // Atualiza a senha do usuário autenticado
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        setError(updateError.message || 'Erro ao atualizar senha')
      } else {
        setSuccess(true)
        setPassword('')
        setConfirmPassword('')

        // Aguarda 2 segundos e redireciona para admin
        setTimeout(() => {
          navigate('/admin', { replace: true })
        }, 2000)
      }
    } catch (err) {
      console.error('Erro:', err)
      setError('Erro ao atualizar senha')
    }

    setLoading(false)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center union-app-bg">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-neutral-700 border-t-yellow-400"></div>
          <p className="mt-4 text-sm text-neutral-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center union-app-bg px-4">
      <div className="w-full max-w-sm">
        <button
          onClick={() => navigate('/login')}
          className="mb-8 flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="mb-8 flex flex-col items-center text-center">
          <UnionLogo size="lg" variant="light" />
          <p className="mt-3 text-sm text-neutral-400">Defina uma nova senha</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 backdrop-blur-xl p-6 shadow-lg"
        >
          <div className="mb-4">
            <label htmlFor="password" className="mb-1.5 block text-sm font-normal text-neutral-300">
              Nova Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-600 bg-transparent px-4 py-2.5 pr-10 text-sm font-normal text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
                style={{ transition: 'background-color 5000s ease-in-out 0s' }}
                placeholder="••••••••"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-normal text-neutral-300">
              Confirmar Senha
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-600 bg-transparent px-4 py-2.5 pr-10 text-sm font-normal text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
                style={{ transition: 'background-color 5000s ease-in-out 0s' }}
                placeholder="••••••••"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {success && (
            <p className="mb-4 rounded-lg bg-green-900/20 border border-green-700/50 px-3 py-2 text-sm text-green-400">
              Senha atualizada com sucesso! Redirecionando...
            </p>
          )}

          {error && (
            <p className="mb-4 rounded-lg bg-red-900/20 border border-red-700/50 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className="w-full rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-yellow-500 disabled:opacity-60"
          >
            {loading ? 'Atualizando...' : 'Atualizar Senha'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-700">
          Acesso de equipe e clientes da agência
        </p>
      </div>
    </div>
  )
}
