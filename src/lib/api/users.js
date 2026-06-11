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
