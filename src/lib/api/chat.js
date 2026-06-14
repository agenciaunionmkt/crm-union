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

// Lista as conversas (um item por cliente que já trocou mensagens),
// com a última mensagem, ordenadas da mais recente para a mais antiga.
export async function listConversations() {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('cliente_id, mensagem, created_at, autor:users ( papel ), client:clients ( id, nome, contato_email )')
    .order('created_at', { ascending: false })

  if (error) throw error

  const porCliente = new Map()
  for (const msg of data) {
    if (!msg.cliente_id || porCliente.has(msg.cliente_id)) continue
    porCliente.set(msg.cliente_id, {
      cliente_id: msg.cliente_id,
      nome: msg.client?.nome ?? 'Cliente',
      contato_email: msg.client?.contato_email ?? '',
      ultimaMensagem: msg.mensagem,
      ultimaData: msg.created_at,
      ultimoAutorPapel: msg.autor?.papel ?? null,
    })
  }
  return Array.from(porCliente.values())
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
