import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // O Supabase automaticamente coloca a sessão em localStorage quando redireciona
        // Aguardamos um pouco para garantir que a sessão foi carregada
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Tenta obter a sessão
        const { data } = await supabase.auth.getSession()

        if (data.session) {
          // Sessão obtida com sucesso, redireciona para redefinição de senha
          navigate('/redefinir-senha', { replace: true })
        } else {
          // Sem sessão, volta para login
          navigate('/login', { replace: true })
        }
      } catch (error) {
        console.error('Erro na autenticação:', error)
        navigate('/login', { replace: true })
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-neutral-700 border-t-yellow-400"></div>
        <p className="mt-4 text-sm text-neutral-400">Autenticando...</p>
      </div>
    </div>
  )
}
