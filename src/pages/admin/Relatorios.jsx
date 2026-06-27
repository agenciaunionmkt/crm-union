import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Download } from 'lucide-react'
import { listClients } from '../../lib/api/clients'
import { getMonthlyReport } from '../../lib/api/reports'
import { generateMonthlyReportPdf } from '../../lib/pdf/monthlyReport'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import {
  demandStatusLabels,
  demandStatusStyles,
  approvalStatusLabels,
  approvalStatusStyles,
} from '../../lib/status'

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
  const [aiResumo, setAiResumo] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  async function gerarResumo() {
    if (!report || aiLoading) return
    setAiLoading(true)
    setAiResumo('')
    try {
      const s = report.summary
      const prompt =
        `Escreva um resumo executivo mensal, cordial e profissional, em português do Brasil, ` +
        `para apresentar ao cliente ${report.client.nome} (segmento: ${report.client.segmento || 'n/d'}). ` +
        `Período: ${format(report.periodo.referenceDate, "MMMM 'de' yyyy", { locale: ptBR })}. ` +
        `Dados reais: ${s.total} demandas no total, ${s.entregue} entregues, ${s.em_andamento} em andamento, ` +
        `${s.em_revisao} em revisão, ${s.a_fazer} a fazer. ` +
        `Destaque os resultados de forma positiva e objetiva (máximo ~120 palavras). Não invente números.`
      const res = await fetch('/api/assistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      if (res.ok) setAiResumo(data.texto || '')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Relatórios</h1>
        <p className="mt-1 text-sm text-muted">Relatório mensal por cliente, com exportação em PDF</p>
      </div>

      <div className="mt-6 glass rounded-2xl p-5 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <Select label="Cliente" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Selecione um cliente</option>
            {(clientsQuery.data ?? []).map((client) => (
              <option key={client.id} value={client.id}>
                {client.nome}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Input
            label="Mês de referência"
            type="month"
            value={monthValue}
            onChange={(e) => setMonthValue(e.target.value)}
            className="[color-scheme:dark]"
          />
        </div>

        <button
          type="button"
          disabled={!report}
          onClick={() => generateMonthlyReportPdf(report)}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 text-subtle px-4 py-2.5 text-sm font-normal hover:bg-white/5 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          <span>Exportar PDF</span>
        </button>
      </div>

      {clienteId && reportQuery.isLoading && (
        <p className="mt-6 text-sm text-muted">Carregando...</p>
      )}

      {clienteId && reportQuery.error && (
        <p className="mt-6 text-sm text-red-400">Erro ao carregar relatório: {reportQuery.error.message}</p>
      )}

      {report && (
        <div className="mt-6 space-y-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-base font-black tracking-tight text-foreground">
              {report.client.nome} — {format(report.periodo.referenceDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
            {report.plano && (
              <p className="mt-1 text-sm text-muted">
                Plano: {report.plano.pacote} · {formatCurrency(report.plano.valor)}/mês
              </p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
                <p className="text-2xl font-black tracking-tight text-foreground">{report.summary.total}</p>
                <p className="text-xs text-muted">Total</p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
                <p className="text-2xl font-black tracking-tight text-foreground">{report.summary.a_fazer}</p>
                <p className="text-xs text-muted">A fazer</p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
                <p className="text-2xl font-black tracking-tight text-foreground">{report.summary.em_andamento}</p>
                <p className="text-xs text-muted">Em andamento</p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
                <p className="text-2xl font-black tracking-tight text-foreground">{report.summary.em_revisao}</p>
                <p className="text-xs text-muted">Em revisão</p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
                <p className="text-2xl font-black tracking-tight text-foreground">{report.summary.entregue}</p>
                <p className="text-xs text-muted">Entregues</p>
              </div>
            </div>
          </div>

          {/* Resumo executivo com IA */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-black tracking-tight text-foreground">Resumo executivo</h3>
              <button
                onClick={gerarResumo}
                disabled={aiLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-normal text-accent hover:bg-accent/20 disabled:opacity-60 transition-colors"
              >
                {aiLoading ? 'Gerando...' : 'Gerar com IA'}
              </button>
            </div>
            {aiResumo ? (
              <p className="mt-3 whitespace-pre-wrap text-sm text-subtle">{aiResumo}</p>
            ) : (
              <p className="mt-3 text-xs text-muted">
                Gere um resumo do mês em linguagem natural para apresentar ao cliente.
              </p>
            )}
          </div>

          <div>
            <h3 className="text-base font-black tracking-tight text-foreground">Demandas do período</h3>
            <div className="mt-3 glass rounded-2xl overflow-hidden">
              {report.demands.length === 0 && (
                <p className="p-6 text-sm text-muted">Nenhuma demanda com prazo neste período.</p>
              )}
              {report.demands.length > 0 && (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-muted">
                    <tr>
                      <th className="px-4 py-3 font-normal">Título</th>
                      <th className="px-4 py-3 font-normal">Tags</th>
                      <th className="px-4 py-3 font-normal">Responsável</th>
                      <th className="px-4 py-3 font-normal">Prazo</th>
                      <th className="px-4 py-3 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.demands.map((demand) => (
                      <tr key={demand.id} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-3 font-black tracking-tight text-foreground">{demand.titulo}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(demand.tags ?? []).map((tag) => (
                              <span
                                key={tag.id}
                                className="rounded-full px-2 py-0.5 text-[10px] font-medium text-foreground"
                                style={{ backgroundColor: tag.cor }}
                              >
                                {tag.nome}
                              </span>
                            ))}
                            {(demand.tags ?? []).length === 0 && '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-subtle">{demand.responsavel?.nome ?? '—'}</td>
                        <td className="px-4 py-3 text-subtle">{formatDate(demand.prazo)}</td>
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
            <h3 className="text-base font-black tracking-tight text-foreground">Aprovações revisadas no período</h3>
            <div className="mt-3 glass rounded-2xl overflow-hidden">
              {report.approvals.length === 0 && (
                <p className="p-6 text-sm text-muted">Nenhuma aprovação revisada neste período.</p>
              )}
              {report.approvals.length > 0 && (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-muted">
                    <tr>
                      <th className="px-4 py-3 font-normal">Demanda</th>
                      <th className="px-4 py-3 font-normal">Resultado</th>
                      <th className="px-4 py-3 font-normal">Avaliado em</th>
                      <th className="px-4 py-3 font-normal">Comentário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.approvals.map((approval) => (
                      <tr key={approval.id} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-3 font-black tracking-tight text-foreground">{approval.demand?.titulo ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${approvalStatusStyles[approval.status]}`}
                          >
                            {approvalStatusLabels[approval.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-subtle">{formatDateTime(approval.reviewed_at)}</td>
                        <td className="px-4 py-3 text-subtle">{approval.feedback || '—'}</td>
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
