import { supabase } from '../supabaseClient'

const REQUEST_SELECT = `
  *,
  client:clients ( id, nome )
`

// ---------------- Solicitações (client_requests) ----------------

export async function listClientRequests() {
  const { data, error } = await supabase
    .from('client_requests')
    .select(REQUEST_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function listClientRequestsByClient(clienteId) {
  const { data, error } = await supabase
    .from('client_requests')
    .select(REQUEST_SELECT)
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createClientRequest(payload) {
  const { data, error } = await supabase
    .from('client_requests')
    .insert(payload)
    .select(REQUEST_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function updateClientRequestStatus(id, status, demandaGeradaId = null) {
  const payload = { status }
  if (demandaGeradaId) payload.demanda_gerada_id = demandaGeradaId

  const { data, error } = await supabase
    .from('client_requests')
    .update(payload)
    .eq('id', id)
    .select(REQUEST_SELECT)
    .single()

  if (error) throw error
  return data
}

// ---------------- Aprovações (approvals) ----------------

const APPROVAL_SELECT = `
  *,
  demand:demands (
    id, titulo, prazo, status,
    client:clients ( id, nome )
  )
`

export async function listApprovalsByClient(clienteId) {
  const { data, error } = await supabase
    .from('approvals')
    .select(APPROVAL_SELECT)
    .order('reviewed_at', { ascending: false, nullsFirst: true })

  if (error) throw error
  return data.filter((a) => a.demand?.client?.id === clienteId)
}

export async function ensurePendingApproval(demandId) {
  const { data: existing, error: existingError } = await supabase
    .from('approvals')
    .select('id')
    .eq('demand_id', demandId)
    .eq('status', 'pendente')
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) return existing

  const { data, error } = await supabase
    .from('approvals')
    .insert({ demand_id: demandId, status: 'pendente' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function reviewApproval(id, status, feedback = null) {
  const { data, error } = await supabase
    .from('approvals')
    .update({ status, feedback, reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .select(APPROVAL_SELECT)
    .single()

  if (error) throw error
  return data
}
