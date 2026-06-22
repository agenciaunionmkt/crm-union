import { supabase } from '../supabaseClient'
import { uploadPublicFile, removePublicFile } from './storage'

export async function listMateriais(clienteId) {
  const { data, error } = await supabase
    .from('materiais')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createMaterial({ clienteId, file, enviadoPor }) {
  const { url, nome } = await uploadPublicFile(file, `materiais/${clienteId}`)
  const { data, error } = await supabase
    .from('materiais')
    .insert({ cliente_id: clienteId, arquivo_url: url, nome_arquivo: nome, enviado_por: enviadoPor ?? null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMaterial(material) {
  await removePublicFile(material.arquivo_url).catch(() => {})
  const { error } = await supabase.from('materiais').delete().eq('id', material.id)
  if (error) throw error
}
