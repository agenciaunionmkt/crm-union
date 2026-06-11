import { supabase } from '../supabaseClient'

export async function listClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('nome', { ascending: true })

  if (error) throw error
  return data
}

export async function getClient(id) {
  const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createClient(payload) {
  const { data, error } = await supabase.from('clients').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateClient(id, payload) {
  const { data, error } = await supabase
    .from('clients')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteClient(id) {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
}

// ---------------- Briefing ----------------

export async function getBriefing(clienteId) {
  const { data, error } = await supabase
    .from('briefings')
    .select('*')
    .eq('cliente_id', clienteId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function upsertBriefing(clienteId, payload) {
  const { data, error } = await supabase
    .from('briefings')
    .upsert(
      { cliente_id: clienteId, ...payload, updated_at: new Date().toISOString() },
      { onConflict: 'cliente_id' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

// ---------------- Planos ----------------

export async function listPlans(clienteId) {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('inicio', { ascending: false })

  if (error) throw error
  return data
}

export async function createPlan(clienteId, payload) {
  const { data, error } = await supabase
    .from('plans')
    .insert({ cliente_id: clienteId, ...payload })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePlan(id, payload) {
  const { data, error } = await supabase
    .from('plans')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePlan(id) {
  const { error } = await supabase.from('plans').delete().eq('id', id)
  if (error) throw error
}
