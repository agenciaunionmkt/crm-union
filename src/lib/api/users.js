import { createClient } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'

export async function listTeamUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, nome, email, papel')
    .in('papel', ['admin', 'equipe'])
    .order('nome')

  if (error) throw error
  return data
}

// Cliente secundário só para criar a conta do cliente sem derrubar a sessão do admin.
// persistSession:false garante que o signUp não substitua o token do admin logado.
const inviteClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, storageKey: 'sb-invite-temp' } }
)

// Cria o acesso de portal para um cliente e envia um link para ele definir a senha.
// Fluxo: cria o usuário de auth (papel cliente) -> vincula na tabela users -> envia link de redefinição.
export async function inviteClientUser({ email, nome, clienteId }) {
  const normalizedEmail = (email || '').trim().toLowerCase()
  if (!normalizedEmail) throw new Error('E-mail de acesso é obrigatório')

  const tempPassword = `${crypto.randomUUID()}Aa1!`
  const { data, error } = await inviteClient.auth.signUp({
    email: normalizedEmail,
    password: tempPassword,
  })

  const jaExiste = error && /already|registered|exists/i.test(error.message)
  if (error && !jaExiste) throw error

  const userId = data?.user?.id
  if (userId) {
    const { error: upsertError } = await supabase
      .from('users')
      .upsert(
        { id: userId, nome, email: normalizedEmail, papel: 'cliente', cliente_id: clienteId },
        { onConflict: 'id' }
      )
    if (upsertError) throw upsertError
  }

  // Envia o link para o cliente criar a própria senha
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: `${window.location.origin}/redefinir-senha`,
  })
  if (resetError) throw resetError

  return { jaExiste: !!jaExiste }
}
