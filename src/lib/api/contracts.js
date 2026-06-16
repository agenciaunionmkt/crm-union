import { supabase } from '../supabaseClient'

export async function listContracts(clienteId) {
  let query = supabase.from('contratos').select('*').order('created_at', { ascending: false })
  if (clienteId) query = query.eq('cliente_id', clienteId)
  const { data, error } = await query
  if (error) throw error
  return data
}

// Lê o arquivo como base64 e envia para a função serverless criar no Autentique.
export async function createContract({ clienteId, titulo, signerEmail, file, createdBy }) {
  const fileBase64 = await fileToBase64(file)
  const res = await fetch('/api/contratos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clienteId,
      titulo,
      signerEmail,
      fileBase64,
      fileName: file.name,
      createdBy,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Não foi possível enviar o contrato')
  return data
}

// Busca/atualiza o link de assinatura de um contrato já existente (sem criar novo no Autentique).
export async function refreshContractLink(contratoId) {
  const res = await fetch('/api/contratos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'refresh-link', contratoId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Não foi possível gerar o link')
  return data
}

export async function deleteContract(id) {
  const { error } = await supabase.from('contratos').delete().eq('id', id)
  if (error) throw error
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
