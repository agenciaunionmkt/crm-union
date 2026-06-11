import { useState } from 'react'
import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UnionLogo from '../components/UnionLogo'
import { supabase } from '../lib/supabaseClient'

export default function Cadastro() {
  const { session, profile, loading } = useAuth()
  const location = useLocation()
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    empresa: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session && profile) {
    const redirectTo =
      location.state?.from?.pathname ||
      (profile.papel === 'cliente' ? '/portal' : '/admin')
    return <Navigate to={redirectTo} replace />
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    // Validações
    if (formData.senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setSubmitting(false)
      return
    }

    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas não correspondem.')
      setSubmitting(false)
      return
    }

    if (!formData.nome.trim()) {
      setError('Nome completo é obrigatório.')
      setSubmitting(false)
      return
    }

    if (!formData.empresa.trim()) {
      setError('Nome da empresa é obrigatório.')
      setSubmitting(false)
      return
    }

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Este e-mail já está registrado.')
        } else {
          setError('Erro ao criar conta: ' + authError.message)
        }
        setSubmitting(false)
        return
      }

      const userId = authData.user.id

      // 2. Criar empresa (cliente)
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert([
          {
            nome: formData.empresa,
            email: formData.email,
          },
        ])
        .select()
        .single()

      if (clientError) {
        console.error('Erro ao criar empresa:', clientError)
        setError('Erro ao criar empresa.')
        setSubmitting(false)
        return
      }

      // 3. Criar usuário na tabela users
      const { error: userError } = await supabase.from('users').insert([
        {
          id: userId,
          nome: formData.nome,
          email: formData.email,
          papel: 'admin', // Admin da sua própria empresa
          cliente_id: clientData.id,
        },
      ])

      if (userError) {
        console.error('Erro ao criar usuário:', userError)
        setError('Erro ao finalizar cadastro.')
        setSubmitting(false)
        return
      }

      // Sucesso! Usuário será redirecionado automaticamente pelo listener
      // pois o session foi criado no auth.signUp
    } catch (err) {
      console.error('Erro inesperado:', err)
      setError('Erro ao completar cadastro. Tente novamente.')
    }

    setSubmitting(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <UnionLogo size="lg" />
          <p className="mt-3 text-sm text-gray-500">Crie sua conta para começar</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-4">
            <label htmlFor="nome" className="mb-1 block text-sm font-medium text-gray-700">
              Nome completo
            </label>
            <input
              id="nome"
              type="text"
              name="nome"
              required
              value={formData.nome}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder="Seu nome"
              disabled={submitting}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="empresa" className="mb-1 block text-sm font-medium text-gray-700">
              Nome da empresa
            </label>
            <input
              id="empresa"
              type="text"
              name="empresa"
              required
              value={formData.empresa}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder="Sua empresa"
              disabled={submitting}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder="voce@empresa.com"
              disabled={submitting}
              autoComplete="email"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="senha" className="mb-1 block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              name="senha"
              required
              value={formData.senha}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder="••••••••"
              disabled={submitting}
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
          </div>

          <div className="mb-4">
            <label htmlFor="confirmarSenha" className="mb-1 block text-sm font-medium text-gray-700">
              Confirmar senha
            </label>
            <input
              id="confirmarSenha"
              type="password"
              name="confirmarSenha"
              required
              value={formData.confirmarSenha}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder="••••••••"
              disabled={submitting}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-brand-600 disabled:opacity-60"
          >
            {submitting ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-600">
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-brand-500 hover:text-brand-600">
            Entrar aqui
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-gray-400">
          Acesso de equipe e clientes da agência
        </p>
      </div>
    </div>
  )
}
