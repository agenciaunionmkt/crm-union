import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addMonths } from 'date-fns'
import { FileText, ExternalLink, Upload, RefreshCw, Copy, Check, Trash2, Sparkles } from 'lucide-react'
import { listContracts, createContract, deleteContract, refreshContractLink } from '../lib/api/contracts'
import { gerarContratoPDF } from '../lib/contratoUnion'
import { reaisPorExtenso, numeroPorExtenso } from '../lib/valorExtenso'
import Input from './ui/Input'
import Textarea from './ui/Textarea'
import Select from './ui/Select'

// dd/mm/aaaa a partir de um input date "aaaa-mm-dd" (sem fuso)
function formatarData(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function GerarContratoForm({ cliente, currentUser, onSent }) {
  const queryClient = useQueryClient()
  const soDigitos = (cliente?.cnpj ?? '').replace(/\D/g, '')
  const [razao, setRazao]       = useState(cliente?.nome ?? '')
  const [fantasia, setFantasia] = useState('')
  const [tipoPessoa, setTipoPessoa] = useState(soDigitos.length === 11 ? 'fisica' : 'juridica')
  const [documento, setDocumento]   = useState(cliente?.cnpj ?? '')
  const [endereco, setEndereco]     = useState(cliente?.endereco ?? '')
  const [cidade, setCidade]         = useState('Macapá/AP')
  const [escopo, setEscopo]         = useState(cliente?.plano_descricao ?? '')
  const [valor, setValor]           = useState(cliente?.valor_servico ? String(cliente.valor_servico) : '')
  const [valorExt, setValorExt]     = useState(cliente?.valor_servico ? reaisPorExtenso(cliente.valor_servico) : '')
  const [diaPag, setDiaPag]         = useState(cliente?.dia_vencimento ? String(cliente.dia_vencimento) : '')
  const [prazoMeses, setPrazoMeses] = useState('3')
  const [dataInicio, setDataInicio] = useState('')
  const [dataPrimeiroPag, setDataPrimeiroPag] = useState('')
  const [signerEmail, setSignerEmail] = useState(cliente?.contato_email ?? '')
  const [sandbox, setSandbox] = useState(false)
  const [erro, setErro] = useState('')

  const dataFim = (() => {
    if (!dataInicio || !prazoMeses) return ''
    const [y, m, d] = dataInicio.split('-').map(Number)
    return formatarData(addMonths(new Date(y, m - 1, d), parseInt(prazoMeses, 10)).toISOString().slice(0, 10))
  })()

  const gerarMutation = useMutation({
    mutationFn: () => {
      const docLabel = tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'
      const qualificacao =
        (fantasia.trim() ? `nome fantasia ${fantasia.trim()}, ` : '') +
        (tipoPessoa === 'fisica' ? 'pessoa física' : 'pessoa jurídica de direito privado')
      const escopoLinhas = escopo.split('\n').map((l) => l.trim()).filter(Boolean)
      const m = parseInt(prazoMeses, 10)
      const dia = parseInt(diaPag, 10)

      const file = gerarContratoPDF({
        contratante: { nome: razao.trim().toUpperCase(), qualificacao, docLabel, doc: documento.trim(), endereco: endereco.trim(), cidade: cidade.trim() },
        escopo: escopoLinhas,
        vigencia: {
          prazo: `${String(m).padStart(2, '0')} (${numeroPorExtenso(m)}) ${m === 1 ? 'mês' : 'meses'}`,
          inicio: formatarData(dataInicio),
          fim: dataFim,
        },
        valorNum: `R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        valorExt: valorExt.trim(),
        pagDia: `${String(dia).padStart(2, '0')} (${numeroPorExtenso(dia)})`,
        pagPrimeiro: formatarData(dataPrimeiroPag),
        assinaturaNome: razao.trim().toUpperCase(),
        assinaturaDoc: `CONTRATANTE - ${docLabel} nº ${documento.trim()}`,
      })

      return createContract({
        clienteId: cliente.id,
        titulo: `Contrato de Prestação de Serviços - ${razao.trim()}`,
        signerEmail: signerEmail.trim(),
        file,
        createdBy: currentUser?.id,
        sandbox,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos', cliente.id] })
      onSent?.()
    },
  })

  function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    const faltando = []
    if (!razao.trim()) faltando.push('razão social/nome')
    if (!documento.trim()) faltando.push('CPF/CNPJ')
    if (!endereco.trim()) faltando.push('endereço')
    if (!escopo.split('\n').some((l) => l.trim())) faltando.push('escopo')
    if (!valor) faltando.push('valor')
    if (!valorExt.trim()) faltando.push('valor por extenso')
    if (!diaPag) faltando.push('dia de pagamento')
    if (!dataInicio) faltando.push('data de início')
    if (!dataPrimeiroPag) faltando.push('data do 1º pagamento')
    if (!signerEmail.trim()) faltando.push('e-mail do signatário')
    if (faltando.length) { setErro('Preencha: ' + faltando.join(', ')); return }
    gerarMutation.mutate()
  }

  const inputDate = 'w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground [color-scheme:dark] focus:border-accent/50 focus:outline-none'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-2 text-xs text-muted">
        Os dados vêm do cadastro do cliente. Confira, complete o que faltar e envie — o contrato é gerado e enviado para assinatura automaticamente.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Razão social / Nome completo" value={razao} onChange={(e) => setRazao(e.target.value)} placeholder="Nome que assina o contrato" />
        <Input label="Nome fantasia (opcional)" value={fantasia} onChange={(e) => setFantasia(e.target.value)} placeholder="Ex: Chef Geane" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select label="Tipo de pessoa" value={tipoPessoa} onChange={(e) => setTipoPessoa(e.target.value)}>
          <option value="juridica">Pessoa jurídica</option>
          <option value="fisica">Pessoa física</option>
        </Select>
        <Input label={tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'} value={documento} onChange={(e) => setDocumento(e.target.value)} />
        <Input label="Cidade/UF" value={cidade} onChange={(e) => setCidade(e.target.value)} />
      </div>

      <Input label="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, bairro" />

      <Textarea
        label="Escopo dos serviços (uma linha por item)"
        value={escopo}
        onChange={(e) => setEscopo(e.target.value)}
        rows={4}
        placeholder={'a) Gestão e presença nas redes sociais (Instagram e Facebook);\nb) Produção de 04 (quatro) Reels por mês;\nc) Gestão de tráfego pago (Meta Ads);'}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Valor mensal (R$)"
          type="number"
          step="0.01"
          value={valor}
          onChange={(e) => { setValor(e.target.value); setValorExt(e.target.value ? reaisPorExtenso(e.target.value) : '') }}
        />
        <Input label="Valor por extenso" value={valorExt} onChange={(e) => setValorExt(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input label="Dia de pagamento" type="number" min="1" max="31" value={diaPag} onChange={(e) => setDiaPag(e.target.value)} />
        <Input label="Prazo (meses)" type="number" min="1" value={prazoMeses} onChange={(e) => setPrazoMeses(e.target.value)} />
        <div>
          <label className="mb-1.5 block text-sm font-normal text-subtle">Início da vigência</label>
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className={inputDate} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-normal text-subtle">1º pagamento</label>
          <input type="date" value={dataPrimeiroPag} onChange={(e) => setDataPrimeiroPag(e.target.value)} className={inputDate} />
        </div>
        <Input label="E-mail para assinatura" type="email" value={signerEmail} onChange={(e) => setSignerEmail(e.target.value)} />
      </div>

      {dataFim && (
        <p className="text-xs text-muted">Término da vigência: <span className="text-foreground">{dataFim}</span></p>
      )}

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={sandbox} onChange={(e) => setSandbox(e.target.checked)} className="rounded border-white/20 bg-white/5 text-yellow-400 accent-yellow-400" />
        <span className="text-xs text-muted">Modo teste (sandbox) — não consome do plano, sem validade jurídica</span>
      </label>

      {(erro || gerarMutation.error) && (
        <p className="text-xs text-danger">{erro || gerarMutation.error.message}</p>
      )}

      <button
        type="submit"
        disabled={gerarMutation.isPending}
        className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-gray-900 hover:opacity-90 disabled:opacity-50 transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        {gerarMutation.isPending ? 'Gerando e enviando...' : 'Gerar e enviar para assinatura'}
      </button>
    </form>
  )
}

const statusStyles = {
  enviado: 'bg-accent/15 text-accent',
  assinado: 'bg-emerald-500/20 text-emerald-300',
  recusado: 'bg-danger/15 text-danger',
}
const statusLabels = {
  enviado: 'Aguardando assinatura',
  assinado: 'Assinado',
  recusado: 'Recusado',
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('pt-BR')
}

export default function ContractsPanel({ clienteId, cliente, defaultEmail = '', currentUser, mode = 'admin' }) {
  const queryClient = useQueryClient()
  const isAdmin = mode === 'admin'

  const [aba, setAba] = useState('gerar')
  const [titulo, setTitulo] = useState('')
  const [signerEmail, setSignerEmail] = useState(defaultEmail)
  const [file, setFile] = useState(null)
  const [sandbox, setSandbox] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  function copiarLink(c) {
    navigator.clipboard?.writeText(c.link_assinatura).then(() => {
      setCopiedId(c.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const contractsQuery = useQuery({
    queryKey: ['contratos', clienteId],
    queryFn: () => listContracts(clienteId),
    enabled: !!clienteId,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createContract({ clienteId, titulo, signerEmail, file, createdBy: currentUser?.id, sandbox }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos', clienteId] })
      setTitulo('')
      setFile(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteContract,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contratos', clienteId] }),
  })

  const refreshMutation = useMutation({
    mutationFn: refreshContractLink,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contratos', clienteId] }),
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!titulo.trim() || !signerEmail.trim() || !file) return
    createMutation.mutate()
  }

  const contratos = contractsQuery.data ?? []

  return (
    <div>
      {isAdmin && (
        <div className="mb-5 flex rounded-lg border border-border p-0.5 bg-surface w-fit">
          {[['gerar', 'Gerar automático'], ['enviar', 'Enviar PDF']].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setAba(val)}
              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                aba === val ? 'bg-white/10 text-foreground' : 'text-muted hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {isAdmin && aba === 'gerar' && cliente && (
        <GerarContratoForm cliente={cliente} currentUser={currentUser} />
      )}
      {isAdmin && aba === 'gerar' && !cliente && (
        <p className="text-sm text-muted">Carregando dados do cliente...</p>
      )}

      {isAdmin && aba === 'enviar' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Título do contrato"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Contrato de prestação de serviços"
            />
            <Input
              label="E-mail do signatário"
              type="email"
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
              placeholder="cliente@empresa.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-normal text-subtle">Arquivo (PDF)</label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-subtle hover:bg-white/10 transition-colors">
              <Upload className="w-4 h-4" />
              <span className="truncate">{file ? file.name : 'Selecionar PDF do contrato'}</span>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sandbox}
              onChange={(e) => setSandbox(e.target.checked)}
              className="rounded border-white/20 bg-white/5 text-yellow-400 accent-yellow-400"
            />
            <span className="text-xs text-muted">
              Modo teste (sandbox) — não consome do plano, sem validade jurídica
            </span>
          </label>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={createMutation.isPending || !titulo.trim() || !signerEmail.trim() || !file}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-gray-900 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending ? 'Enviando...' : 'Enviar contrato'}
            </button>
            {createMutation.error && (
              <span className="text-xs text-danger">{createMutation.error.message}</span>
            )}
          </div>
        </form>
      )}

      <div className={isAdmin ? 'mt-6' : ''}>
        {contractsQuery.isLoading && <p className="text-sm text-muted">Carregando contratos...</p>}

        {!contractsQuery.isLoading && contratos.length === 0 && (
          <p className="text-sm text-muted">
            {isAdmin ? 'Nenhum contrato enviado ainda.' : 'Você não tem contratos no momento.'}
          </p>
        )}

        {isAdmin && refreshMutation.error && (
          <p className="mb-2 text-xs text-danger">{refreshMutation.error.message}</p>
        )}

        <div className="space-y-2">
          {contratos.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3"
            >
              <FileText className="w-5 h-5 flex-shrink-0 text-muted" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-normal text-white">{c.titulo}</p>
                <p className="text-xs text-muted">
                  {c.signed_at ? `Assinado em ${formatDate(c.signed_at)}` : `Enviado em ${formatDate(c.created_at)}`}
                </p>
              </div>

              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[c.status]}`}>
                {statusLabels[c.status]}
              </span>

              {/* Cliente assina; admin acompanha o documento assinado */}
              {!isAdmin && c.status === 'enviado' && c.link_assinatura && (
                <a
                  href={c.link_assinatura}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-gray-900 hover:opacity-90 transition-colors"
                >
                  Assinar <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {c.status === 'assinado' && c.arquivo_url && (
                <a
                  href={c.arquivo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-normal text-subtle hover:bg-white/5 transition-colors"
                >
                  Ver PDF <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {/* Admin: gera o link (fallback) ou copia para enviar ao cliente */}
              {isAdmin && c.status === 'enviado' && !c.link_assinatura && (
                <button
                  type="button"
                  onClick={() => refreshMutation.mutate(c.id)}
                  disabled={refreshMutation.isPending && refreshMutation.variables === c.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 disabled:opacity-60 transition-colors"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${refreshMutation.isPending && refreshMutation.variables === c.id ? 'animate-spin' : ''}`}
                  />
                  {refreshMutation.isPending && refreshMutation.variables === c.id ? 'Gerando...' : 'Gerar link'}
                </button>
              )}

              {isAdmin && c.status === 'enviado' && c.link_assinatura && (
                <>
                  <button
                    type="button"
                    onClick={() => copiarLink(c)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-normal text-subtle hover:bg-white/5 transition-colors"
                  >
                    {copiedId === c.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copiar link
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => refreshMutation.mutate(c.id)}
                    disabled={refreshMutation.isPending && refreshMutation.variables === c.id}
                    title="Verificar se o cliente já assinou"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-normal text-subtle hover:bg-white/5 disabled:opacity-60 transition-colors"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${refreshMutation.isPending && refreshMutation.variables === c.id ? 'animate-spin' : ''}`}
                    />
                    Atualizar status
                  </button>
                </>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Remover o contrato "${c.titulo}" do painel?`)) {
                      deleteMutation.mutate(c.id)
                    }
                  }}
                  title="Remover do painel"
                  aria-label="Remover do painel"
                  className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-danger transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
