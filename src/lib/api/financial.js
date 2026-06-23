import { supabase } from '../supabaseClient'

// Listar entradas/saídas financeiras
export async function listFinancialEntries(filters = {}) {
  let query = supabase
    .from('financial_entries')
    .select('*')
    .order('vencimento', { ascending: true })

  if (filters.tipo) {
    query = query.eq('tipo', filters.tipo)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

// Obter entrada/saída específica
export async function getFinancialEntry(id) {
  const { data, error } = await supabase
    .from('financial_entries')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// Criar entrada/saída
export async function createFinancialEntry(payload) {
  const { data, error } = await supabase
    .from('financial_entries')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

// Atualizar entrada/saída
export async function updateFinancialEntry(id, payload) {
  const { data, error } = await supabase
    .from('financial_entries')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Deletar entrada/saída
export async function deleteFinancialEntry(id) {
  const { error } = await supabase
    .from('financial_entries')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// Cobranças de um cliente (para o portal do cliente acompanhar)
export async function listClientCharges(clienteId) {
  const { data, error } = await supabase
    .from('financial_entries')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('tipo', 'entrada')
    .order('vencimento', { ascending: false })

  if (error) throw error
  return data
}

// Obter resumo financeiro (total entradas, saídas, saldo)
export async function getFinancialSummary() {
  const { data: entries, error } = await supabase
    .from('financial_entries')
    .select('tipo, valor, status')

  if (error) throw error

  const summary = {
    totalEntradas: 0,   // tudo faturado (entradas, qualquer status)
    totalSaidas: 0,     // todas as saídas
    recebido: 0,        // entradas efetivamente pagas
    aReceber: 0,        // entradas pendentes/vencidas (faturado, não recebido)
    saidasPagas: 0,
    saldo: 0,           // caixa real: recebido - saídas pagas
  }

  entries?.forEach((entry) => {
    const v = entry.valor || 0
    if (entry.tipo === 'entrada') {
      summary.totalEntradas += v
      if (entry.status === 'pago') summary.recebido += v
      else summary.aReceber += v
    } else {
      summary.totalSaidas += v
      if (entry.status === 'pago') summary.saidasPagas += v
    }
  })

  // Saldo reflete apenas o que entrou de fato menos o que saiu de fato
  summary.saldo = summary.recebido - summary.saidasPagas

  return summary
}
