import { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import UnionLogo from '../components/UnionLogo'

export default function Login() {
  const { session, profile, loading, signIn, signInWithGoogle } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Remove autofill styling completely
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      input:-webkit-autofill {
        -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
        -webkit-text-fill-color: #ffffff !important;
        background-color: transparent !important;
        background-image: none !important;
        caret-color: #ffffff !important;
      }
      input:-webkit-autofill:hover {
        -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
        -webkit-text-fill-color: #ffffff !important;
        background-color: transparent !important;
        background-image: none !important;
      }
      input:-webkit-autofill:focus {
        -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
        -webkit-text-fill-color: #ffffff !important;
        background-color: transparent !important;
        background-image: none !important;
        border-color: #a3a3a3 !important;
      }
    `
    document.head.appendChild(style)

    // Força a remoção do styling quando o input recebe valor
    const inputs = document.querySelectorAll('input[type="email"], input[type="password"]')
    inputs.forEach(input => {
      input.addEventListener('animationstart', (e) => {
        if (e.animationName === 'onAutoFillStart') {
          input.style.WebkitBoxShadow = '0 0 0 1000px transparent inset !important'
          input.style.WebkitTextFillColor = '#ffffff !important'
          input.style.backgroundColor = 'transparent !important'
        }
      })
    })

    return () => document.head.removeChild(style)
  }, [])

  if (!loading && session && profile) {
    const redirectTo =
      location.state?.from?.pathname ||
      (profile.papel === 'cliente' ? '/portal' : '/admin')
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError('E-mail ou senha inválidos.')
    }
    setSubmitting(false)
  }

  async function handleGoogleSignIn() {
    setError('')
    setGoogleLoading(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setError('Não foi possível entrar com o Google.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <UnionLogo size="lg" variant="light" />
          <p className="mt-3 text-sm text-neutral-400">Entre com sua conta para continuar</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 backdrop-blur-xl p-6 shadow-lg"
        >
          <div className="mb-4">
            <label htmlFor="email" className="mb-1.5 block text-sm font-normal text-neutral-300">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-neutral-600 bg-transparent px-4 py-2.5 text-sm font-normal text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
              style={{
                transition: 'background-color 5000s ease-in-out 0s',
              }}
              placeholder="voce@empresa.com"
              autoComplete="off"
            />
          </div>

          <div className="mb-2">
            <label htmlFor="password" className="mb-1.5 block text-sm font-normal text-neutral-300">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-600 bg-transparent px-4 py-2.5 pr-10 text-sm font-normal text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
                style={{
                  transition: 'background-color 5000s ease-in-out 0s',
                }}
                placeholder="••••••••"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300 focus:outline-none"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="mb-4 text-right">
            <a href="/esqueci-senha" className="text-xs text-neutral-500 hover:text-neutral-400">
              Esqueci minha senha
            </a>
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-red-900/20 border border-red-700/50 px-3 py-2 text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-yellow-500 disabled:opacity-60"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-700" />
            <span className="text-xs text-neutral-500">ou</span>
            <div className="h-px flex-1 bg-neutral-700" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-600 bg-neutral-800/50 px-4 py-2.5 text-sm font-normal text-neutral-300 hover:bg-neutral-700/50 disabled:opacity-60"
          >
            <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              />
              <path
                fill="#FF3D00"
                d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
              />
            </svg>
            {googleLoading ? 'Conectando...' : 'Entrar com Google'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-600">
          Não tem conta? <a href="/cadastro" className="font-normal text-neutral-400 hover:text-neutral-300">Criar conta aqui</a>
        </p>

        <p className="mt-6 text-center text-xs text-neutral-700">
          Acesso de equipe e clientes da agência
        </p>
      </div>
    </div>
  )
}
