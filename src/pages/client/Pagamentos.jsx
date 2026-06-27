import { useQuery } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { listClientCharges } from '../../lib/api/financial'

const statusLabels = {
  pendente: 'Aguardando pagamento',
  pago: 'Pago',
  vencido: 'Vencido',
}
const statusStyles = {
  pendente: 'bg-accent/15 text-accent border border-accent/30',
  pago: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  vencido: 'bg-red-500/15 text-red-300 border border-red-500/30',
}

function formatBRL(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function formatDate(value) {
  if (!value) return '—'
  const [y, m, d] = value.split('-')
  return `${d}/${m}/${y}`
}

export default function ClientPagamentos() {
  const { profile } = useAuth()

  const { data: cobrancas = [], isLoading } = useQuery({
    queryKey: ['client-charges', profile?.cliente_id],
    queryFn: () => listClientCharges(profile.cliente_id),
    enabled: !!profile?.cliente_id,
  })

  const aPagar = cobrancas
    .filter((c) => c.status !== 'pago')
    .reduce((s, c) => s + Number(c.valor || 0), 0)
  const totalPago = cobrancas
    .filter((c) => c.status === 'pago')
    .reduce((s, c) => s + Number(c.valor || 0), 0)

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight text-foreground">Pagamentos</h1>
      <p className="mt-1 text-sm text-muted">Acompanhe suas cobranças e faça o pagamento por PIX ou boleto</p>

      {/* Resumo */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-muted">Em aberto</p>
          <p className="text-2xl font-normal text-accent">{formatBRL(aPagar)}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-muted">Total pago</p>
          <p className="text-2xl font-normal text-emerald-400">{formatBRL(totalPago)}</p>
        </div>
      </div>

      <div className="mt-6 glass rounded-2xl overflow-hidden">
        {isLoading && <p className="p-6 text-sm text-muted">Carregando...</p>}
        {!isLoading && cobrancas.length === 0 && (
          <p className="p-6 text-sm text-muted">Você ainda não tem cobranças.</p>
        )}
        {cobrancas.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-normal">Descrição</th>
                <th className="px-4 py-3 font-normal">Vencimento</th>
                <th className="px-4 py-3 font-normal">Valor</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal text-right">Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {cobrancas.map((c) => (
                <tr key={c.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-white">{c.nome}</td>
                  <td className="px-4 py-3 text-subtle">{formatDate(c.vencimento)}</td>
                  <td className="px-4 py-3 text-subtle">{formatBRL(c.valor)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-normal ${statusStyles[c.status]}`}>
                      {statusLabels[c.status] || c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.status !== 'pago' && c.link_pagamento ? (
                      <a
                        href={c.link_pagamento}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-gray-900 hover:opacity-90 transition-colors"
                      >
                        Pagar <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : c.status === 'pago' ? (
                      <span className="text-xs text-emerald-400">Pago</span>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
