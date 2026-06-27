import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import UnionLogo from '../components/UnionLogo'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      })

      if (error) {
        setError(error.message || 'Erro ao enviar link de acesso')
      } else {
        setSuccess(true)
        setEmail('')
      }
    } catch (err) {
      setError('Erro ao enviar link de acesso')
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center union-app-bg px-4">
      <div className="w-full max-w-sm">
        <button
          onClick={() => navigate('/login')}
          className="mb-8 flex items-center gap-2 text-sm text-muted hover:text-subtle transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="mb-8 flex flex-col items-center text-center">
          <UnionLogo size="lg" variant="light" />
          <p className="mt-3 text-sm text-muted">Acesso seguro por link</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 backdrop-blur-xl p-6 shadow-lg"
        >
          <div className="mb-6 flex items-start gap-3">
            <Mail className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted">
              Digite seu e-mail e receba um link seguro para acessar sua conta.
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="mb-1.5 block text-sm font-normal text-subtle">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border-strong bg-transparent px-4 py-2.5 text-sm font-normal text-foreground placeholder:text-subtle focus:border-accent focus:outline-none"
              style={{ transition: 'background-color 5000s ease-in-out 0s' }}
              placeholder="voce@empresa.com"
              autoComplete="off"
            />
          </div>

          {success && (
            <div className="mb-4 rounded-lg bg-success/10 border border-success/30 px-4 py-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-success">Link enviado!</p>
                  <p className="text-xs text-success mt-1">Verifique seu e-mail e clique no link para acessar sua conta.</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="mb-4 rounded-lg bg-danger/10 border border-danger/30 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-gray-900 hover:opacity-90 disabled:opacity-60 transition-all"
          >
            {loading ? 'Enviando link...' : 'Enviar link de acesso'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-700">
          Acesso de equipe e clientes da agência
        </p>
      </div>
    </div>
  )
}
