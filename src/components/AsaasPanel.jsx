import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, Check, ExternalLink, RefreshCw } from 'lucide-react'
import { createCharge, createSubscription } from '../lib/api/asaasBilling'
import Input from './ui/Input'

function formatBRL(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function AsaasPanel({ cliente }) {
  const queryClient = useQueryClient()
  const isRecorrente = cliente.tipo_cliente === 'recorrente'

  const [valor, setValor] = useState(cliente.valor_servico ?? '')
  const [vencimento, setVencimento] = useState('')
  const [descricao, setDescricao] = useState('')
  const [link, setLink] = useState('')
  const [copiado, setCopiado] = useState(false)

  const cobrancaMut = useMutation({
    mutationFn: () => createCharge(cliente.id, { valor: Number(valor), vencimento: vencimento || undefined, descricao: descricao || undefined }),
    onSuccess: (data) => {
      setLink(data.link)
      queryClient.invalidateQueries({ queryKey: ['financial'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
    },
  })

  const assinaturaMut = useMutation({
    mutationFn: () => createSubscription(cliente.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients', cliente.id] }),
  })

  function copiar() {
    navigator.clipboard?.writeText(link).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  const semCnpj = !cliente.cnpj

  return (
    <div className="space-y-5">
      {semCnpj && (
        <p className="rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-3 py-2 text-xs text-yellow-200">
          Cadastre o CNPJ do cliente para gerar cobranças no Asaas.
        </p>
      )}

      {/* Assinatura mensal (clientes recorrentes) */}
      {isRecorrente && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-normal text-white">Assinatura mensal</p>
              <p className="text-xs text-muted">
                {cliente.asaas_subscription_id
                  ? 'Assinatura ativa — o Asaas gera a mensalidade todo mês automaticamente.'
                  : `Cobra ${formatBRL(cliente.valor_servico)} todo dia ${cliente.dia_vencimento || '—'}.`}
              </p>
            </div>
            {cliente.asaas_subscription_id ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs text-emerald-300">
                <Check className="w-3.5 h-3.5" /> Ativa
              </span>
            ) : (
              <button
                type="button"
                onClick={() => assinaturaMut.mutate()}
                disabled={assinaturaMut.isPending || semCnpj || !cliente.valor_servico}
                className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-400 px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-yellow-500 disabled:opacity-50 transition-colors"
              >
                {assinaturaMut.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                Criar assinatura
              </button>
            )}
          </div>
          {assinaturaMut.error && <p className="mt-2 text-xs text-red-400">{assinaturaMut.error.message}</p>}
        </div>
      )}

      {/* Cobrança avulsa */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <p className="mb-3 text-sm font-normal text-white">Cobrança avulsa (PIX + boleto)</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input label="Valor" type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} leftIcon="R$" />
          <Input label="Vencimento" type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} className="[color-scheme:dark]" />
          <Input label="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Serviço pontual" />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => cobrancaMut.mutate()}
            disabled={cobrancaMut.isPending || semCnpj || !valor}
            className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-500 disabled:opacity-50 transition-colors"
          >
            {cobrancaMut.isPending ? 'Gerando...' : 'Gerar cobrança'}
          </button>
          {cobrancaMut.error && <span className="text-xs text-red-400">{cobrancaMut.error.message}</span>}
        </div>

        {link && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
            <span className="text-xs text-emerald-200">Cobrança criada. Envie o link ao cliente:</span>
            <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-300 underline">
              <ExternalLink className="w-3.5 h-3.5" /> Abrir fatura
            </a>
            <button type="button" onClick={copiar} className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-xs text-subtle hover:bg-white/5">
              {copiado ? <><Check className="w-3 h-3 text-emerald-400" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar link</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
