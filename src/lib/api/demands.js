import { supabase } from '../supabaseClient'
import { ensurePendingApproval } from './requests'

const DEMAND_SELECT = `
  *,
  responsavel:users!demands_responsavel_id_fkey ( id, nome )
`

function normalizeDemand(row) {
  if (!row) return row
  return {
    ...row,
    tags: [],
  }
}

export async function listDemands({ from, to } = {}) {
  let query = supabase
    .from('demands')
    .select(DEMAND_SELECT)
    .order('prazo', { ascending: true, nullsFirst: false })

  if (from) query = query.gte('prazo', from)
  if (to) query = query.lte('prazo', to)

  const { data, error } = await query
  if (error) throw error
  return data.map(normalizeDemand)
}

export async function listDemandsByClient(clienteId) {
  const { data, error } = await supabase
    .from('demands')
    .select(DEMAND_SELECT)
    .eq('cliente_id', clienteId)
    .order('prazo', { ascending: true, nullsFirst: false })

  if (error) throw error
  return data.map(normalizeDemand)
}

export async function createDemand(payload, tagIds = []) {
  const { data, error } = await supabase.from('demands').insert(payload).select().single()
  if (error) throw error

  if (tagIds.length > 0) {
    await setDemandTags(data.id, tagIds)
  }

  // Toda demanda de um cliente entra na fila de aprovação do portal do cliente
  if (data.cliente_id) {
    try {
      await ensurePendingApproval(data.id)
    } catch (e) {
      console.warn('Não foi possível criar aprovação pendente:', e)
    }
  }

  return data
}

export async function updateDemand(id, payload, tagIds) {
  const { data, error } = await supabase
    .from('demands')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  if (tagIds) {
    await setDemandTags(id, tagIds)
  }

  if (payload.status === 'em_revisao') {
    await ensurePendingApproval(id)
  }

  return data
}

export async function updateDemandStatus(id, status) {
  const { data, error } = await supabase
    .from('demands')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  if (status === 'em_revisao') {
    await ensurePendingApproval(id)
  }

  return normalizeDemand(data)
}

export async function deleteDemand(id) {
  const { error } = await supabase.from('demands').delete().eq('id', id)
  if (error) throw error
}

export async function setDemandTags(demandId, tagIds) {
  const { error: deleteError } = await supabase
    .from('demand_tags')
    .delete()
    .eq('demand_id', demandId)
  if (deleteError) throw deleteError

  if (tagIds.length === 0) return

  const rows = tagIds.map((tagId) => ({ demand_id: demandId, tag_id: tagId }))
  const { error: insertError } = await supabase.from('demand_tags').insert(rows)
  if (insertError) throw insertError
}

// ---------------- Tags ----------------

export async function listTags() {
  const { data, error } = await supabase.from('tags').select('*').order('nome')
  if (error) throw error
  return data
}

export async function createTag(payload) {
  const { data, error } = await supabase.from('tags').insert(payload).select().single()
  if (error) throw error
  return data
}
