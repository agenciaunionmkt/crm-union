import { useState, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import UnionLogo from '../components/UnionLogo'

export default function Cadastro() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      input:-webkit-autofill {
        -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
        -webkit-text-fill-color: #ffffff !important;
        background-color: transparent !important;
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  if (!loading && session) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    if (!nome.trim()) {
      setError('Nome é obrigatório')
      setSubmitting(false)
      return
    }

    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres')
      setSubmitting(false)
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      setSubmitting(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(signUpError.message || 'Erro ao criar conta')
      setSubmitting(false)
      return
    }

    if (data?.user) {
      const { error: insertError } = await supabase.from('users').insert({
        id: data.user.id,
        nome: nome.trim(),
        email,
        papel: 'cliente',
      })

      if (insertError) {
        setError('Erro ao salvar perfil: ' + insertError.message)
        setSubmitting(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    }

    setSubmitting(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <UnionLogo size="lg" variant="light" />
          <p className="mt-3 text-sm text-neutral-400">Crie sua conta para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 backdrop-blur-xl p-6 shadow-lg">
          <div className="mb-4">
            <label htmlFor="nome" className="mb-1.5 block text-sm font-normal text-neutral-300">Nome Completo</label>
            <input
              id="nome"
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border border-neutral-600 bg-transparent px-4 py-2.5 text-sm font-normal text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
              style={{ transition: 'background-color 5000s ease-in-out 0s' }}
              placeholder="Seu nome completo"
              autoComplete="off"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="mb-1.5 block text-sm font-normal text-neutral-300">E-mail</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-neutral-600 bg-transparent px-4 py-2.5 text-sm font-normal text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
              style={{ transition: 'background-color 5000s ease-in-out 0s' }}
              placeholder="voce@empresa.com"
              autoComplete="off"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="mb-1.5 block text-sm font-normal text-neutral-300">Senha</label>
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
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-normal text-neutral-300">Confirmar Senha</label>
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
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300">
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {success && <p className="mb-4 rounded-lg bg-green-900/20 border border-green-700/50 px-3 py-2 text-sm text-green-400">Conta criada com sucesso!</p>}
          {error && <p className="mb-4 rounded-lg bg-red-900/20 border border-red-700/50 px-3 py-2 text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={submitting || success} className="w-full rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-yellow-500 disabled:opacity-60">
            {submitting ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-600">Já tem conta? <a href="/login" className="font-normal text-neutral-400 hover:text-neutral-300">Fazer login</a></p>
        <p className="mt-6 text-center text-xs text-neutral-700">Acesso de equipe e clientes da agência</p>
      </div>
    </div>
  )
}
