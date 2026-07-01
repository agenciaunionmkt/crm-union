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

// Garante lançamentos do mês atual para clientes recorrentes e para
// lançamentos manuais recorrentes (entradas ou saídas avulsas, ex: aluguel).
// Recebe as entries já carregadas para deduplicar sem query extra.
export async function ensureMonthlyRecurring(recurringClients, existingEntries) {
  const hoje = new Date()
  const anoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()
  const doMes = (existingEntries ?? []).filter((e) => e.vencimento?.startsWith(anoMes))

  const novos = []

  // 1) Mensalidades de clientes recorrentes (entrada vinculada a cliente_id)
  if (recurringClients?.length) {
    const doMesEntrada = doMes.filter((e) => e.tipo === 'entrada')
    const porId   = new Set(doMesEntrada.filter((e) => e.cliente_id).map((e) => e.cliente_id))
    const porNome = new Set(doMesEntrada.map((e) => e.nome?.toLowerCase().trim()))

    for (const c of recurringClients) {
      if (!c.valor_servico) continue
      if (porId.has(c.id)) continue
      if (porNome.has(`mensalidade - ${c.nome}`.toLowerCase().trim())) continue
      const dia = c.dia_vencimento || 10
      const diaFinal = Math.min(dia, ultimoDia)
      novos.push({
        nome:       `Mensalidade - ${c.nome}`,
        tipo:       'entrada',
        categoria:  'servicos',
        valor:      c.valor_servico,
        status:     'pendente',
        vencimento: `${anoMes}-${String(diaFinal).padStart(2, '0')}`,
        cliente_id: c.id,
        recorrente: true,
        frequencia: 'mensal',
      })
    }
  }

  // 2) Lançamentos manuais recorrentes (entrada ou saída, sem cliente_id, frequência mensal):
  // repete o último lançamento de cada grupo (tipo + nome) no mês atual, se ainda não existir.
  const ultimoPorGrupo = new Map()
  for (const e of (existingEntries ?? [])) {
    if (!e.recorrente || e.cliente_id || e.frequencia !== 'mensal') continue
    const chave = `${e.tipo}::${e.nome?.toLowerCase().trim()}`
    const atual = ultimoPorGrupo.get(chave)
    if (!atual || e.vencimento > atual.vencimento) ultimoPorGrupo.set(chave, e)
  }

  const chavesDoMes = new Set(doMes.map((e) => `${e.tipo}::${e.nome?.toLowerCase().trim()}`))

  for (const [chave, ultimo] of ultimoPorGrupo) {
    if (chavesDoMes.has(chave)) continue
    if (ultimo.vencimento?.startsWith(anoMes)) continue

    const diaOriginal = parseInt(ultimo.vencimento?.split('-')[2] ?? '10', 10)
    const diaFinal = Math.min(diaOriginal || 10, ultimoDia)

    novos.push({
      nome:            ultimo.nome,
      tipo:            ultimo.tipo,
      categoria:       ultimo.categoria,
      valor:           ultimo.valor,
      status:          'pendente',
      vencimento:      `${anoMes}-${String(diaFinal).padStart(2, '0')}`,
      forma_pagamento: ultimo.forma_pagamento,
      cliente_id:      null,
      recorrente:      true,
      frequencia:      'mensal',
    })
  }

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
