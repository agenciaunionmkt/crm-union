import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import UnionLogo from '../components/UnionLogo'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await sendPasswordReset(email)

    if (error) {
      setError(error.message || 'Erro ao enviar email de recuperação')
    } else {
      setSuccess(true)
      setEmail('')
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900 px-4">
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
          <p className="mt-3 text-sm text-neutral-400">Recupere seu acesso</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 backdrop-blur-xl p-6 shadow-lg"
        >
          <p className="mb-6 text-sm text-neutral-400">
            Digite seu e-mail para receber um link de recuperação de senha.
          </p>

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
              style={{ transition: 'background-color 5000s ease-in-out 0s' }}
              placeholder="voce@empresa.com"
              autoComplete="off"
            />
          </div>

          {success && (
            <div className="mb-4 rounded-lg bg-green-900/20 border border-green-700/50 px-3 py-2">
              <p className="text-sm text-green-400 font-normal">E-mail enviado! Verifique sua caixa de entrada.</p>
            </div>
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
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-700">
          Acesso de equipe e clientes da agência
        </p>
      </div>
    </div>
  )
}
