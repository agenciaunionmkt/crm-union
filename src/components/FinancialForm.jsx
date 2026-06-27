import { useState } from 'react'
import Input from './ui/Input'
import Select from './ui/Select'
import Textarea from './ui/Textarea'

const emptyForm = {
  nome: '',
  valor: '',
  tipo: 'saida',
  forma_pagamento: 'pix',
  vencimento: '',
  status: 'pendente',
  categoria: '',
  notas: '',
  recorrente: false,
  frequencia: 'mensal',
}

// Próxima data de vencimento a partir de um dia do mês (1-31).
function proximoVencimento(dia) {
  const d = parseInt(dia, 10)
  if (!d) return ''
  const hoje = new Date()
  let ano = hoje.getFullYear()
  let mes = hoje.getMonth()
  if (d < hoje.getDate()) mes += 1
  const ultimoDia = new Date(ano, mes + 1, 0).getDate()
  const data = new Date(ano, mes, Math.min(d, ultimoDia))
  return data.toISOString().split('T')[0]
}

function formatBRL(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function FinancialForm({ initialValues, clientes = [], onSubmit, onCancel, submitting }) {
  const isEdit = Boolean(initialValues?.id)
  const recorrentes = (clientes || []).filter((c) => c.tipo_cliente === 'recorrente' && c.valor_servico)

  const [modo, setModo] = useState(isEdit || recorrentes.length === 0 ? 'avulso' : 'recorrente')
  const [clienteId, setClienteId] = useState('')
  const [form, setForm] = useState({ ...emptyForm, ...initialValues })
  const [errors, setErrors] = useState({})

  function selecionarCliente(id) {
    setClienteId(id)
    const c = recorrentes.find((x) => x.id === id)
    if (!c) return
    setForm((prev) => ({
      ...prev,
      nome: `Mensalidade - ${c.nome}`,
      valor: c.valor_servico ?? '',
      tipo: 'entrada',
      recorrente: true,
      frequencia: 'mensal',
      status: 'pendente',
      vencimento: proximoVencimento(c.dia_vencimento) || prev.vencimento,
    }))
    setErrors({})
  }

  function trocarModo(novo) {
    setModo(novo)
    setClienteId('')
    setErrors({})
    if (novo === 'recorrente') {
      setForm({ ...emptyForm, tipo: 'entrada' })
    } else {
      setForm({ ...emptyForm })
    }
  }

  function suggestCategoryWithAI() {
    if (!form.nome) {
      alert('Preencha o nome primeiro')
      return
    }
    const nome = form.nome.toLowerCase()
    const categorias = {
      aluguel: 'Operacional', salário: 'Pessoal', compra: 'Suprimentos',
      publicidade: 'Marketing', design: 'Criativo', energia: 'Utilidades',
      água: 'Utilidades', internet: 'Tecnologia', software: 'Tecnologia',
      venda: 'Receita', serviço: 'Receita', honorário: 'Receita', mensalidade: 'Receita',
    }
    let categoria = 'Geral'
    for (const [palavra, cat] of Object.entries(categorias)) {
      if (nome.includes(palavra)) { categoria = cat; break }
    }
    setForm((prev) => ({ ...prev, categoria }))
  }

  function handleChange(field) {
    return (e) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const newErrors = {}
    if (modo === 'recorrente' && !clienteId) newErrors.cliente = 'Selecione um cliente'
    if (!form.nome?.trim()) newErrors.nome = 'Nome é obrigatório'
    if (!form.valor || form.valor <= 0) newErrors.valor = 'Valor deve ser maior que 0'
    if (!form.vencimento) newErrors.vencimento = 'Vencimento é obrigatório'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    onSubmit({ ...form, valor: parseFloat(form.valor) })
  }

  const statusSelect = (
    <Select label="Status" value={form.status} onChange={handleChange('status')}>
      <option value="pendente">Pendente</option>
      <option value="pago">Pago</option>
      <option value="vencido">Vencido</option>
    </Select>
  )

  const formaSelect = (
    <Select label="Forma de Pagamento" value={form.forma_pagamento} onChange={handleChange('forma_pagamento')}>
      <option value="dinheiro">Dinheiro</option>
      <option value="pix">PIX</option>
      <option value="cartao">Cartão</option>
      <option value="transferencia">Transferência</option>
      <option value="boleto">Boleto</option>
    </Select>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Seletor de origem (apenas em novo lançamento e se houver clientes recorrentes) */}
      {!isEdit && recorrentes.length > 0 && (
        <div>
          <label className="mb-1.5 block text-sm font-normal text-subtle">Origem do lançamento</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: 'recorrente', t: 'Cliente recorrente' },
              { v: 'avulso', t: 'Avulso / manual' },
            ].map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => trocarModo(opt.v)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  modo === opt.v
                    ? 'border-accent/50 bg-accent/15 text-accent'
                    : 'border-white/15 text-subtle hover:bg-white/5'
                }`}
              >
                {opt.t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MODO RECORRENTE: seleciona o cliente e puxa o valor da mensalidade */}
      {modo === 'recorrente' && (
        <>
          <Select
            label="Cliente"
            value={clienteId}
            onChange={(e) => selecionarCliente(e.target.value)}
            error={errors.cliente}
          >
            <option value="">Selecione o cliente...</option>
            {recorrentes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} — {formatBRL(c.valor_servico)}/mês
              </option>
            ))}
          </Select>

          {clienteId && (
            <>
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-subtle">
                Lançamento: <span className="text-white">{form.nome}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Valor (R$) *"
                  type="number"
                  step="0.01"
                  value={form.valor}
                  onChange={handleChange('valor')}
                  error={errors.valor}
                  leftIcon="R$"
                />
                <Input
                  label="Vencimento *"
                  type="date"
                  value={form.vencimento}
                  onChange={handleChange('vencimento')}
                  error={errors.vencimento}
                  className="[color-scheme:dark]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {statusSelect}
                {formaSelect}
              </div>
            </>
          )}
        </>
      )}

      {/* MODO AVULSO/MANUAL: lançamento livre (entrada ou saída) */}
      {modo === 'avulso' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Tipo" value={form.tipo} onChange={handleChange('tipo')}>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </Select>
            {statusSelect}
          </div>

          <Input
            label="Nome/Descrição *"
            value={form.nome}
            onChange={handleChange('nome')}
            error={errors.nome}
            placeholder="Ex: Aluguel do escritório"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valor (R$) *"
              type="number"
              step="0.01"
              value={form.valor}
              onChange={handleChange('valor')}
              error={errors.valor}
              leftIcon="R$"
            />
            <Input
              label="Vencimento *"
              type="date"
              value={form.vencimento}
              onChange={handleChange('vencimento')}
              error={errors.vencimento}
              className="[color-scheme:dark]"
            />
          </div>

          {formaSelect}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-sm font-normal text-subtle">Categoria</label>
              <button
                type="button"
                onClick={suggestCategoryWithAI}
                disabled={!form.nome}
                className="text-xs font-normal text-accent hover:text-accent/80 disabled:text-muted"
              >
                Sugerir
              </button>
            </div>
            <Input
              value={form.categoria ?? ''}
              onChange={handleChange('categoria')}
              placeholder="Ex: Operacional, Pessoal..."
            />
          </div>

          <Textarea
            label="Notas"
            value={form.notas ?? ''}
            onChange={handleChange('notas')}
            placeholder="Observações adicionais..."
          />

          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.recorrente}
                onChange={(e) => setForm((prev) => ({ ...prev, recorrente: e.target.checked }))}
                className="rounded border-white/20 bg-white/5 text-yellow-400 accent-yellow-400"
              />
              <span className="text-sm font-normal text-subtle">Lançamento recorrente</span>
            </label>
            <p className="mt-1 text-xs text-muted">Marque se esta despesa/receita se repete periodicamente</p>
          </div>

          {form.recorrente && (
            <Select label="Frequência" value={form.frequencia} onChange={handleChange('frequencia')}>
              <option value="semanal">Semanal</option>
              <option value="bimensal">Bimensal</option>
              <option value="mensal">Mensal</option>
              <option value="trimestral">Trimestral</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
            </Select>
          )}
        </>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm font-normal text-subtle hover:bg-white/5 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting || (modo === 'recorrente' && !clienteId)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-gray-900 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
