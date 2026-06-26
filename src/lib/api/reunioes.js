import { supabase } from '../supabaseClient'

const SELECT = '*, client:clients ( id, nome )'

// Lista as reuniões visíveis ao usuário (RLS: equipe vê todas; cliente vê as suas).
export async function listReunioes() {
  const { data, error } = await supabase
    .from('reunioes')
    .select(SELECT)
    .order('inicio', { ascending: true })
  if (error) throw error
  return data
}

export async function createReuniao(payload) {
  const { data, error } = await supabase.from('reunioes').insert(payload).select(SELECT).single()
  if (error) throw error
  return data
}

export async function deleteReuniao(id) {
  const { error } = await supabase.from('reunioes').delete().eq('id', id)
  if (error) throw error
}
