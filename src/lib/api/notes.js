import { supabase } from '../supabaseClient'

export async function listClientNotes(clienteId) {
  const { data, error } = await supabase
    .from('client_notes')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createClientNote(clienteId, payload) {
  const { data, error } = await supabase
    .from('client_notes')
    .insert({ cliente_id: clienteId, ...payload })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateClientNote(id, payload) {
  const { data, error } = await supabase
    .from('client_notes')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteClientNote(id) {
  const { error } = await supabase.from('client_notes').delete().eq('id', id)
  if (error) throw error
}
