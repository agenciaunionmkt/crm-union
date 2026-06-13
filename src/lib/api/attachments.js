import { supabase } from '../supabaseClient'

const BUCKET = 'anexos'

export async function listAttachments(demandId) {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('demand_id', demandId)
    .order('created_at', { ascending: false })

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

  const { data, error } = await supabase
    .from('attachments')
    .insert({
      demand_id: demandId,
      arquivo_url: pub.publicUrl,
      nome_arquivo: file.name,
      enviado_por: userId ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteAttachment(attachment) {
  // Remove o arquivo do Storage (caminho após "/anexos/")
  const marker = `/${BUCKET}/`
  const idx = attachment.arquivo_url.lastIndexOf(marker)
  if (idx !== -1) {
    const path = decodeURIComponent(attachment.arquivo_url.slice(idx + marker.length))
    await supabase.storage.from(BUCKET).remove([path])
  }

  const { error } = await supabase.from('attachments').delete().eq('id', attachment.id)
  if (error) throw error
}
