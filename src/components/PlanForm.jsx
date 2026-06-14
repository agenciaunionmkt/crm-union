import { useState } from 'react'

const emptyForm = {
  pacote: '',
  valor: '',
  inicio: '',
  fim: '',
  status: 'ativo',
}

const fieldClass =
  'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20'
const labelClass = 'mb-1.5 block text-sm font-normal text-neutral-300'

export default function PlanForm({ initialValues, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({ ...emptyForm, ...initialValues })

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({
      ...form,
      valor: form.valor === '' ? null : Number(form.valor),
      inicio: form.inicio || null,
      fim: form.fim || null,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className={labelClass}>Pacote</label>
        <input
          required
          value={form.pacote}
          onChange={handleChange('pacote')}
          className={fieldClass}
          placeholder="Ex: Social Media Essencial"
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Valor mensal (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.valor ?? ''}
            onChange={handleChange('valor')}
            className={fieldClass}
            placeholder="0,00"
          />
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select value={form.status} onChange={handleChange('status')} className={fieldClass}>
            <option value="ativo">Ativo</option>
            <option value="pausado">Pausado</option>
            <option value="encerrado">Encerrado</option>
          </select>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Início</label>
          <input type="date" value={form.inicio ?? ''} onChange={handleChange('inicio')} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>Fim</label>
          <input type="date" value={form.fim ?? ''} onChange={handleChange('fim')} className={fieldClass} />
        </div>
      </div>

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
          className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-500 disabled:opacity-60 transition-colors"
        >
          {submitting ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
