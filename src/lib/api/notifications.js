import { supabase } from '../supabaseClient'

export async function listNotifications(userId, limit = 20) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function createNotification({ userId, titulo, mensagem, link }) {
  if (!userId) return null
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, titulo, mensagem: mensagem ?? null, link: link ?? null })
  if (error) throw error
}

// Cria uma notificação para toda a equipe (admin + equipe).
// Usa RPC SECURITY DEFINER para funcionar mesmo quando quem dispara é o cliente (RLS).
export async function notifyTeam({ titulo, mensagem, link }) {
  const { error } = await supabase.rpc('notify_team', {
    p_titulo: titulo,
    p_mensagem: mensagem ?? null,
    p_link: link ?? null,
  })
  if (error) console.warn('notify_team:', error.message)
}

// Cria uma notificação para os usuários (portal) de um cliente.
export async function notifyClient(clienteId, { titulo, mensagem, link }) {
  if (!clienteId) return
  const { error } = await supabase.rpc('notify_client', {
    p_cliente_id: clienteId,
    p_titulo: titulo,
    p_mensagem: mensagem ?? null,
    p_link: link ?? null,
  })
  if (error) console.warn('notify_client:', error.message)
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ lida: true })
    .eq('user_id', userId)
    .eq('lida', false)
  if (error) throw error
}
