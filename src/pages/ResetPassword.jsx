import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UnionLogo from '../components/UnionLogo'

export default function ResetPassword() {
  const { session, passwordRecovery, updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Sem sessão de recuperação ativa e sem nenhuma sessão: redireciona para o login
  if (!session && !passwordRecovery) {
    return <Navigate to="/login" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setSubmitting(true)
    const { error } = await updatePassword(password)

    if (error) {
      setError('Não foi possível redefinir a senha. Tente novamente.')
    } else {
      setDone(true)
    }
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <UnionLogo size="md" />
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">Redefinir senha</h1>
          <p className="mt-1 text-sm text-gray-500">Escolha uma nova senha de acesso</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {done ? (
            <div className="text-center">
              <p className="text-sm text-gray-700">Senha redefinida com sucesso!</p>
              <a
                href="/login"
                className="mt-4 inline-block text-sm font-medium text-gray-900 hover:underline"
              >
                Ir para o login
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                  Nova senha
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="confirmPassword"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Confirmar nova senha
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  placeholder="••••••••"
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
                {submitting ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
