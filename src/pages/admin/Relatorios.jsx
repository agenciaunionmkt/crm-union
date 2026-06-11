import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { listClients } from '../../lib/api/clients'
import { getMonthlyReport } from '../../lib/api/reports'
import { generateMonthlyReportPdf } from '../../lib/pdf/monthlyReport'
import { demandStatusLabels, demandStatusStyles } from '../client/Demandas'

const approvalStatusLabels = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  revisao_solicitada: 'Revisão solicitada',
}

const approvalStatusStyles = {
  pendente: 'bg-yellow-100 text-yellow-700',
  aprovado: 'bg-green-100 text-green-700',
  revisao_solicitada: 'bg-orange-100 text-orange-700',
}

function formatDate(value) {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR')
}

function formatCurrency(value) {
  if (value === null || value === undefined) return '—'
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Relatorios() {
  const [clienteId, setClienteId] = useState('')
  const [monthValue, setMonthValue] = useState(format(new Date(), 'yyyy-MM'))

  const referenceDate = useMemo(() => {
    const [year, month] = monthValue.split('-').map(Number)
    return new Date(year, month - 1, 1)
  }, [monthValue])

  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: listClients,
  })

  const reportQuery = useQuery({
    queryKey: ['monthly-report', clienteId, monthValue],
    queryFn: () => getMonthlyReport(clienteId, referenceDate),
    enabled: !!clienteId,
  })

  const report = reportQuery.data

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-normal text-neutral-900 dark:text-white">Relatórios</h1>
        <p className="mt-1.5 text-xs text-neutral-700 dark:text-neutral-400">Relatório mensal por cliente, com exportação em PDF</p>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-2 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Cliente</label>
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="w-64 rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          >
            <option value="">Selecione um cliente</option>
            {(clientsQuery.data ?? []).map((client) => (
              <option key={client.id} value={client.id}>
                {client.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Mês de referência</label>
          <input
            type="month"
            value={monthValue}
            onChange={(e) => setMonthValue(e.target.value)}
            className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          />
        </div>

        <button
          type="button"
          disabled={!report}
          onClick={() => generateMonthlyReportPdf(report)}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-400 dark:border-neutral-500 text-neutral-600 dark:text-neutral-400 px-4 py-2 text-xs font-normal hover:bg-neutral-100 dark:hover:bg-neutral-800/30 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Exportar PDF</span>
        </button>
      </div>

      {clienteId && reportQuery.isLoading && (
        <p className="mt-6 text-sm text-gray-400">Carregando...</p>
      )}

      {clienteId && reportQuery.error && (
        <p className="mt-6 text-sm text-red-600">Erro ao carregar relatório: {reportQuery.error.message}</p>
      )}

      {report && (
        <div className="mt-6 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-700">
              {report.client.nome} — {format(report.periodo.referenceDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
            {report.plano && (
              <p className="mt-1 text-sm text-gray-500">
                Plano: {report.plano.pacote} · {formatCurrency(report.plano.valor)}/mês
              </p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-2xl font-normal text-gray-900">{report.summary.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-2xl font-normal text-gray-900">{report.summary.a_fazer}</p>
                <p className="text-xs text-gray-500">A fazer</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-2xl font-normal text-gray-900">{report.summary.em_andamento}</p>
                <p className="text-xs text-gray-500">Em andamento</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-2xl font-normal text-gray-900">{report.summary.em_revisao}</p>
                <p className="text-xs text-gray-500">Em revisão</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-2xl font-normal text-gray-900">{report.summary.entregue}</p>
                <p className="text-xs text-gray-500">Entregues</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700">Demandas do período</h3>
            <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
              {report.demands.length === 0 && (
                <p className="p-6 text-sm text-gray-400">Nenhuma demanda com prazo neste período.</p>
              )}
              {report.demands.length > 0 && (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Título</th>
                      <th className="px-4 py-3 font-medium">Tags</th>
                      <th className="px-4 py-3 font-medium">Responsável</th>
                      <th className="px-4 py-3 font-medium">Prazo</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.demands.map((demand) => (
                      <tr key={demand.id} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-3 font-medium text-gray-900">{demand.titulo}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(demand.tags ?? []).map((tag) => (
                              <span
                                key={tag.id}
                                className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                                style={{ backgroundColor: tag.cor }}
                              >
                                {tag.nome}
                              </span>
                            ))}
                            {(demand.tags ?? []).length === 0 && '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{demand.responsavel?.nome ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(demand.prazo)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${demandStatusStyles[demand.status]}`}
                          >
                            {demandStatusLabels[demand.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700">Aprovações revisadas no período</h3>
            <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
              {report.approvals.length === 0 && (
                <p className="p-6 text-sm text-gray-400">Nenhuma aprovação revisada neste período.</p>
              )}
              {report.approvals.length > 0 && (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Demanda</th>
                      <th className="px-4 py-3 font-medium">Resultado</th>
                      <th className="px-4 py-3 font-medium">Avaliado em</th>
                      <th className="px-4 py-3 font-medium">Comentário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.approvals.map((approval) => (
                      <tr key={approval.id} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-3 font-medium text-gray-900">{approval.demand?.titulo ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${approvalStatusStyles[approval.status]}`}
                          >
                            {approvalStatusLabels[approval.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{formatDateTime(approval.reviewed_at)}</td>
                        <td className="px-4 py-3 text-gray-600">{approval.feedback || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
