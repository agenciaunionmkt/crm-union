import { supabase } from '../supabaseClient'

const BUCKET = 'anexos'

// Faz upload de um arquivo para o bucket público e retorna a URL.
export async function uploadPublicFile(file, prefix = 'diversos') {
  const safe = file.name.replace(/[^\w.\-]+/g, '_')
  const path = `${prefix}/${crypto.randomUUID()}-${safe}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, nome: file.name }
}

export function isImageUrl(value) {
  return /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(value || '')
}

// Remove o arquivo do bucket a partir da URL pública.
export async function removePublicFile(url) {
  const marker = `/${BUCKET}/`
  const idx = (url || '').lastIndexOf(marker)
  if (idx === -1) return
  const path = decodeURIComponent(url.slice(idx + marker.length))
  await supabase.storage.from(BUCKET).remove([path])
}
