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

// Garante lançamentos do mês atual para clientes recorrentes.
// Recebe as entries já carregadas para deduplicar sem query extra.
export async function ensureMonthlyRecurring(recurringClients, existingEntries) {
  if (!recurringClients?.length) return false

  const hoje = new Date()
  const anoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`

  const doMes = (existingEntries ?? []).filter(
    (e) => e.tipo === 'entrada' && e.vencimento?.startsWith(anoMes)
  )

  // Dedup por cliente_id
  const porId = new Set(doMes.filter((e) => e.cliente_id).map((e) => e.cliente_id))

  // Dedup por nome normalizado (captura entradas antigas sem cliente_id)
  const porNome = new Set(doMes.map((e) => e.nome?.toLowerCase().trim()))

  const novos = recurringClients
    .filter((c) => {
      if (!c.valor_servico) return false
      if (porId.has(c.id)) return false
      if (porNome.has(`mensalidade - ${c.nome}`.toLowerCase().trim())) return false
      return true
    })
    .map((c) => {
      const dia = c.dia_vencimento || 10
      const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()
      const diaFinal  = Math.min(dia, ultimoDia)
      const vencimento = `${anoMes}-${String(diaFinal).padStart(2, '0')}`
      return {
        nome:       `Mensalidade - ${c.nome}`,
        tipo:       'entrada',
        categoria:  'servicos',
        valor:      c.valor_servico,
        status:     'pendente',
        vencimento,
        cliente_id: c.id,
        recorrente: true,
        frequencia: 'mensal',
      }
    })

  if (novos.length) {
    await supabase.from('financial_entries').insert(novos)
    return true
  }
  return false
}

// Alterna status de um lançamento entre pago e pendente
export async function toggleEntryPaid(entry) {
  const novoStatus = entry.status === 'pago' ? 'pendente' : 'pago'
  const { data, error } = await supabase
    .from('financial_entries')
    .update({ status: novoStatus })
    .eq('id', entry.id)
    .select()
    .single()
  if (error) throw error
  return data
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
