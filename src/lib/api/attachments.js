import { supabase } from '../supabaseClient'

const BUCKET = 'anexos'

export async function listAttachments(demandId) {
  // Tenta ordenar por `ordem`; se a coluna ainda não existir, usa created_at
  let { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('demand_id', demandId)
    .order('ordem', { ascending: true })

  if (error?.message?.includes('ordem')) {
    ;({ data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('demand_id', demandId)
      .order('created_at', { ascending: true }))
  }

  if (error) throw error
  return data
}

export async function uploadAttachment(demandId, file, userId) {
  const safeName = file.name.replace(/[^\w.\-]+/g, '_')
  const path = `${demandId}/${crypto.randomUUID()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false })
  if (uploadError) throw uploadError

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)

  const payload = {
    demand_id: demandId,
    arquivo_url: pub.publicUrl,
    nome_arquivo: file.name,
    enviado_por: userId ?? null,
  }

  // Tenta incluir `ordem`; se a coluna não existir ainda ignora silenciosamente
  try {
    const { data: existing } = await supabase
      .from('attachments')
      .select('ordem')
      .eq('demand_id', demandId)
      .order('ordem', { ascending: false })
      .limit(1)
    if (existing?.[0]?.ordem !== undefined) {
      payload.ordem = (existing[0].ordem ?? 0) + 1
    }
  } catch (_) { /* migration ainda não rodada */ }

  const { data, error } = await supabase
    .from('attachments')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function replaceAttachment(attachment, newFile) {
  // Remove arquivo antigo do Storage
  const marker = `/${BUCKET}/`
  const idx = attachment.arquivo_url.lastIndexOf(marker)
  if (idx !== -1) {
    const oldPath = decodeURIComponent(attachment.arquivo_url.slice(idx + marker.length))
    await supabase.storage.from(BUCKET).remove([oldPath])
  }

  // Faz upload do novo arquivo
  const safeName = newFile.name.replace(/[^\w.\-]+/g, '_')
  const path = `${attachment.demand_id}/${crypto.randomUUID()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, newFile, { upsert: false })
  if (uploadError) throw uploadError

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)

  const { data, error } = await supabase
    .from('attachments')
    .update({ arquivo_url: pub.publicUrl, nome_arquivo: newFile.name })
    .eq('id', attachment.id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateAttachmentOrders(orderedIds) {
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('attachments').update({ ordem: index + 1 }).eq('id', id)
    )
  )
}

export async function deleteAttachment(attachment) {
  const marker = `/${BUCKET}/`
  const idx = attachment.arquivo_url.lastIndexOf(marker)
  if (idx !== -1) {
    const path = decodeURIComponent(attachment.arquivo_url.slice(idx + marker.length))
    await supabase.storage.from(BUCKET).remove([path])
  }

  const { error } = await supabase.from('attachments').delete().eq('id', attachment.id)
  if (error) throw error
}
