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
        <Select label="Tipo" value={form.tipo} onChange={handleChange('tipo')}>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </Select>

        <Select label="Status" value={form.status} onChange={handleChange('status')}>
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
          <option value="vencido">Vencido</option>
        </Select>
      </div>

      <Input
        label="Nome/Descrição *"
        required
        value={form.nome}
        onChange={handleChange('nome')}
        error={errors.nome}
        placeholder="Ex: Aluguel do escritório"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Valor (R$) *"
          required
          type="number"
          step="0.01"
          value={form.valor}
          onChange={handleChange('valor')}
          error={errors.valor}
          placeholder="0,00"
        />

        <Input
          label="Vencimento *"
          required
          type="date"
          value={form.vencimento}
          onChange={handleChange('vencimento')}
          error={errors.vencimento}
          className="[color-scheme:dark]"
        />
      </div>

      <Select label="Forma de Pagamento" value={form.forma_pagamento} onChange={handleChange('forma_pagamento')}>
        <option value="dinheiro">Dinheiro</option>
        <option value="pix">PIX</option>
        <option value="cartao">Cartão</option>
        <option value="transferencia">Transferência</option>
        <option value="boleto">Boleto</option>
      </Select>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="block text-sm font-normal text-neutral-300">Categoria</label>
          <button
            type="button"
            onClick={suggestCategoryWithAI}
            disabled={!form.nome}
            className="text-xs font-normal text-yellow-300 hover:text-yellow-200 disabled:text-neutral-500"
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
          <span className="text-sm font-normal text-neutral-300">Despesa Recorrente</span>
        </label>
        <p className="mt-1 text-xs text-neutral-400">Marca se esta despesa/receita se repete periodicamente</p>
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

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm font-normal text-neutral-300 hover:bg-white/5 transition-colors"
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
