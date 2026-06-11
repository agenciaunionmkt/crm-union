import { supabase } from '../supabaseClient'

const ATTACHMENTS_BUCKET = 'attachments'

// ---------------- Comentários ----------------

const COMMENT_SELECT = `
  *,
  autor:users ( id, nome, papel )
`

export async function listComments(demandId, { onlyExternal = false } = {}) {
  let query = supabase
    .from('comments')
    .select(COMMENT_SELECT)
    .eq('demand_id', demandId)
    .order('created_at', { ascending: true })

  if (onlyExternal) {
    query = query.eq('interno', false)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createComment({ demandId, autorId, mensagem, interno = true }) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ demand_id: demandId, autor_id: autorId, mensagem, interno })
    .select(COMMENT_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function deleteComment(id) {
  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) throw error
}

// ---------------- Anexos ----------------

const ATTACHMENT_SELECT = `
  *,
  enviado_por_usuario:users ( id, nome )
`

export async function listAttachments(demandId) {
  const { data, error } = await supabase
    .from('attachments')
    .select(ATTACHMENT_SELECT)
    .eq('demand_id', demandId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function uploadAttachment({ demandId, file, enviadoPor }) {
  const path = `${demandId}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(path, file)

  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from(ATTACHMENTS_BUCKET).getPublicUrl(path)

  const { data, error } = await supabase
    .from('attachments')
    .insert({
      demand_id: demandId,
      arquivo_url: urlData.publicUrl,
      nome_arquivo: file.name,
      enviado_por: enviadoPor,
    })
    .select(ATTACHMENT_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function deleteAttachment(attachment) {
  const { error } = await supabase.from('attachments').delete().eq('id', attachment.id)
  if (error) throw error

  // Tenta remover o arquivo do storage (não bloqueia se falhar)
  try {
    const marker = `/object/public/${ATTACHMENTS_BUCKET}/`
    const idx = attachment.arquivo_url?.indexOf(marker)
    if (idx !== undefined && idx >= 0) {
      const path = attachment.arquivo_url.slice(idx + marker.length)
      await supabase.storage.from(ATTACHMENTS_BUCKET).remove([path])
    }
  } catch {
    // ignora erros de limpeza do storage
  }
}
