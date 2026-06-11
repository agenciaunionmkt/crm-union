import { supabase } from '../supabaseClient'

const MESSAGE_SELECT = `
  *,
  autor:users ( id, nome, papel )
`

export async function listMessages(clienteId) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(MESSAGE_SELECT)
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function sendMessage({ clienteId, autorId, mensagem }) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ cliente_id: clienteId, autor_id: autorId, mensagem })
    .select(MESSAGE_SELECT)
    .single()

  if (error) throw error
  return data
}
