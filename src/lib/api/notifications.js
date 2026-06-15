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
export async function notifyTeam({ titulo, mensagem, link }) {
  const { data: team, error } = await supabase
    .from('users')
    .select('id')
    .in('papel', ['admin', 'equipe'])
  if (error || !team?.length) return
  const rows = team.map((u) => ({
    user_id: u.id,
    titulo,
    mensagem: mensagem ?? null,
    link: link ?? null,
  }))
  await supabase.from('notifications').insert(rows)
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ lida: true })
    .eq('user_id', userId)
    .eq('lida', false)
  if (error) throw error
}
