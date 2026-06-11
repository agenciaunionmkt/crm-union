import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UnionLogo from '../components/UnionLogo'

export default function ForgotPassword() {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error } = await sendPasswordReset(email)

    if (error) {
      setError('Não foi possível enviar o e-mail de recuperação. Verifique o endereço informado.')
    } else {
      setSent(true)
    }
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <UnionLogo size="md" />
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">Recuperar senha</h1>
          <p className="mt-1 text-sm text-gray-500">
            Informe seu e-mail para receber o link de redefinição
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {sent ? (
            <div className="text-center">
              <p className="text-sm text-gray-700">
                Se houver uma conta cadastrada com o e-mail <strong>{email}</strong>, você
                receberá um link para redefinir sua senha em instantes.
              </p>
              <Link
                to="/login"
                className="mt-4 inline-block text-sm font-medium text-gray-900 hover:underline"
              >
                Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  placeholder="voce@empresa.com"
                  autoComplete="email"
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
                {submitting ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>

              <Link
                to="/login"
                className="mt-4 block text-center text-xs text-gray-500 hover:text-gray-700"
              >
                Voltar para o login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
