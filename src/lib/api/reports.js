import { endOfMonth, format, startOfMonth } from 'date-fns'
import { supabase } from '../supabaseClient'
import { getClient, listPlans } from './clients'

const DEMAND_SELECT = `
  *,
  responsavel:users!demands_responsavel_id_fkey ( id, nome ),
  demand_tags ( tag:tags ( id, nome, cor ) )
`

const APPROVAL_SELECT = `
  *,
  demand:demands ( id, titulo, prazo, status, cliente_id )
`

function normalizeDemand(row) {
  if (!row) return row
  return {
    ...row,
    tags: (row.demand_tags ?? []).map((dt) => dt.tag).filter(Boolean),
  }
}

/**
 * Monta os dados do relatório mensal de um cliente:
 * - dados do cliente e plano ativo
 * - demandas com prazo dentro do mês (agrupadas por status)
 * - aprovações revisadas dentro do mês
 */
export async function getMonthlyReport(clienteId, referenceDate) {
  const from = format(startOfMonth(referenceDate), 'yyyy-MM-dd')
  const to = format(endOfMonth(referenceDate), 'yyyy-MM-dd')

  const [client, plans, demandsResult, approvalsResult] = await Promise.all([
    getClient(clienteId),
    listPlans(clienteId),
    supabase
      .from('demands')
      .select(DEMAND_SELECT)
      .eq('cliente_id', clienteId)
      .gte('prazo', from)
      .lte('prazo', to)
      .order('prazo', { ascending: true }),
    supabase
      .from('approvals')
      .select(APPROVAL_SELECT)
      .gte('reviewed_at', `${from}T00:00:00`)
      .lte('reviewed_at', `${to}T23:59:59`)
      .order('reviewed_at', { ascending: true }),
  ])

  if (demandsResult.error) throw demandsResult.error
  if (approvalsResult.error) throw approvalsResult.error

  const demands = demandsResult.data.map(normalizeDemand)
  const approvals = approvalsResult.data.filter((a) => a.demand?.cliente_id === clienteId)

  const summary = {
    total: demands.length,
    a_fazer: demands.filter((d) => d.status === 'a_fazer').length,
    em_andamento: demands.filter((d) => d.status === 'em_andamento').length,
    em_revisao: demands.filter((d) => d.status === 'em_revisao').length,
    entregue: demands.filter((d) => d.status === 'entregue').length,
  }

  const planoAtivo = (plans ?? []).find((p) => p.status === 'ativo') ?? null

  return {
    client,
    plano: planoAtivo,
    periodo: { from, to, referenceDate },
    demands,
    approvals,
    summary,
  }
}
