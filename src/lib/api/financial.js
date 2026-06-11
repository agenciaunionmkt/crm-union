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

// Obter resumo financeiro (total entradas, saídas, saldo)
export async function getFinancialSummary() {
  const { data: entries, error } = await supabase
    .from('financial_entries')
    .select('tipo, valor, status')

  if (error) throw error

  const summary = {
    totalEntradas: 0,
    totalSaidas: 0,
    pagos: 0,
    pendentes: 0,
    vencidos: 0,
    saldo: 0,
  }

  entries?.forEach((entry) => {
    if (entry.tipo === 'entrada') {
      summary.totalEntradas += entry.valor || 0
    } else {
      summary.totalSaidas += entry.valor || 0
    }

    if (entry.status === 'pago') {
      summary.pagos += entry.valor || 0
    } else if (entry.status === 'pendente') {
      summary.pendentes += entry.valor || 0
    } else if (entry.status === 'vencido') {
      summary.vencidos += entry.valor || 0
    }
  })

  summary.saldo = summary.totalEntradas - summary.totalSaidas

  return summary
}
