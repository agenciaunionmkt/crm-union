import { useState } from 'react'

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

export default function FinancialForm({ initialValues, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({ ...emptyForm, ...initialValues })
  const [errors, setErrors] = useState({})

  function suggestCategoryWithAI() {
    if (!form.nome) {
      alert('Preencha o nome primeiro')
      return
    }

    // Sugestão simples baseada em palavras-chave
    const nome = form.nome.toLowerCase()
    const categorias = {
      'aluguel': 'Operacional',
      'salário': 'Pessoal',
      'compra': 'Suprimentos',
      'publicidade': 'Marketing',
      'design': 'Criativo',
      'energia': 'Utilidades',
      'água': 'Utilidades',
      'internet': 'Tecnologia',
      'software': 'Tecnologia',
      'venda': 'Receita',
      'serviço': 'Receita',
      'honorário': 'Receita',
    }

    let categoria = 'Geral'
    for (const [palavra, cat] of Object.entries(categorias)) {
      if (nome.includes(palavra)) {
        categoria = cat
        break
      }
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

    if (!form.nome?.trim()) newErrors.nome = 'Nome é obrigatório'
    if (!form.valor || form.valor <= 0) newErrors.valor = 'Valor deve ser maior que 0'
    if (!form.vencimento) newErrors.vencimento = 'Vencimento é obrigatório'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit({
      ...form,
      valor: parseFloat(form.valor),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-normal text-neutral-900 dark:text-neutral-300">
            Tipo
          </label>
          <select
            value={form.tipo}
            onChange={handleChange('tipo')}
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm font-normal bg-transparent dark:bg-transparent text-neutral-900 dark:text-white focus:border-neutral-600 dark:focus:border-neutral-600 focus:outline-none focus:ring-emerald-500/30"
          >
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-normal text-neutral-900 dark:text-neutral-300">
            Status
          </label>
          <select
            value={form.status}
            onChange={handleChange('status')}
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm font-normal bg-transparent dark:bg-transparent text-neutral-900 dark:text-white focus:border-neutral-600 dark:focus:border-neutral-600 focus:outline-none focus:ring-emerald-500/30"
          >
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="vencido">Vencido</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-normal text-neutral-300">
          Nome/Descrição *
        </label>
        <input
          required
          value={form.nome}
          onChange={handleChange('nome')}
          className={`w-full rounded-lg border px-3 py-2 text-sm font-normal bg-transparent dark:bg-transparent text-neutral-900 dark:text-white focus:outline-none ${
            errors.nome
              ? 'border-red-400 dark:border-red-500 focus:border-neutral-600 dark:focus:border-neutral-600 focus:ring-red-500/30'
              : 'border-neutral-300 dark:border-neutral-600 focus:border-neutral-600 dark:focus:border-neutral-600 focus:ring-emerald-500/30'
          }`}
          placeholder="Ex: Aluguel do escritório"
        />
        {errors.nome && <p className="mt-1 text-xs text-red-400">{errors.nome}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-normal text-neutral-900 dark:text-neutral-300">
            Valor (R$) *
          </label>
          <input
            required
            type="number"
            step="0.01"
            value={form.valor}
            onChange={handleChange('valor')}
            className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-sm font-normal text-white placeholder-neutral-500 focus:outline-none focus:ring-2 ${
              errors.valor
                ? 'border-red-400/60 focus:ring-red-500/20'
                : 'border-white/15 focus:border-yellow-400/50 focus:ring-yellow-400/20'
            }`}
            placeholder="0,00"
          />
          {errors.valor && <p className="mt-1 text-xs text-red-400">{errors.valor}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-normal text-neutral-900 dark:text-neutral-300">
            Vencimento *
          </label>
          <input
            required
            type="date"
            value={form.vencimento}
            onChange={handleChange('vencimento')}
            className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-sm font-normal text-white placeholder-neutral-500 focus:outline-none focus:ring-2 ${
              errors.vencimento
                ? 'border-red-400/60 focus:ring-red-500/20'
                : 'border-white/15 focus:border-yellow-400/50 focus:ring-yellow-400/20'
            }`}
          />
          {errors.vencimento && <p className="mt-1 text-xs text-red-400">{errors.vencimento}</p>}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-normal text-neutral-300">
          Forma de Pagamento
        </label>
        <select
          value={form.forma_pagamento}
          onChange={handleChange('forma_pagamento')}
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
        >
          <option value="dinheiro">Dinheiro</option>
          <option value="pix">PIX</option>
          <option value="cartao">Cartão</option>
          <option value="transferencia">Transferência</option>
          <option value="boleto">Boleto</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-normal text-neutral-300">
              Categoria
            </label>
            <button
              type="button"
              onClick={suggestCategoryWithAI}
              disabled={!form.nome}
              className="text-xs font-normal text-yellow-300 hover:text-yellow-200 disabled:text-neutral-500"
            >
              Sugerir
            </button>
          </div>
          <input
            value={form.categoria ?? ''}
            onChange={handleChange('categoria')}
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm font-normal bg-transparent dark:bg-transparent text-neutral-900 dark:text-white focus:border-neutral-600 dark:focus:border-neutral-600 focus:outline-none focus:ring-emerald-500/30"
            placeholder="Ex: Operacional, Pessoal..."
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-normal text-neutral-300">
          Notas
        </label>
        <textarea
          value={form.notas ?? ''}
          onChange={handleChange('notas')}
          rows="3"
          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm font-normal bg-transparent dark:bg-transparent text-neutral-900 dark:text-white focus:border-neutral-600 dark:focus:border-neutral-600 focus:outline-none focus:ring-emerald-500/30"
          placeholder="Observações adicionais..."
        />
      </div>

      <div className="rounded-lg bg-white/5 border border-white/10 p-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.recorrente}
            onChange={(e) => setForm((prev) => ({ ...prev, recorrente: e.target.checked }))}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-normal text-neutral-900 dark:text-neutral-300">Despesa Recorrente</span>
        </label>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">Marca se esta despesa/receita se repete periodicamente</p>
      </div>

      {form.recorrente && (
        <div>
          <label className="mb-1 block text-sm font-normal text-neutral-900 dark:text-neutral-300">
            Frequência
          </label>
          <select
            value={form.frequencia}
            onChange={handleChange('frequencia')}
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm font-normal bg-transparent dark:bg-transparent text-neutral-900 dark:text-white focus:border-neutral-600 dark:focus:border-neutral-600 focus:outline-none focus:ring-emerald-500/30"
          >
            <option value="semanal">Semanal</option>
            <option value="bimensal">Bimensal</option>
            <option value="mensal">Mensal</option>
            <option value="trimestral">Trimestral</option>
            <option value="semestral">Semestral</option>
            <option value="anual">Anual</option>
          </select>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-normal text-neutral-900 dark:text-neutral-300 bg-transparent dark:bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-700/60 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
