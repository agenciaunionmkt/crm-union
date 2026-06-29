import { supabase } from '../supabaseClient'

export async function listLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createLead(payload) {
  const { data, error } = await supabase.from('leads').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateLead(id, payload) {
  const { data, error } = await supabase.from('leads').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteLead(id) {
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) throw error
}
