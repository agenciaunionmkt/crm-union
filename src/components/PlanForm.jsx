import { useState } from 'react'

const emptyForm = {
  pacote: '',
  valor: '',
  inicio: '',
  fim: '',
  status: 'ativo',
}

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
        <label className="mb-1 block text-sm font-normal text-gray-700">Pacote</label>
        <input
          required
          value={form.pacote}
          onChange={handleChange('pacote')}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-neutral-600 focus:outline-none focus:ring-brand-200"
          placeholder="Ex: Social Media Essencial"
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-normal text-gray-700">Valor mensal (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.valor ?? ''}
            onChange={handleChange('valor')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-neutral-600 focus:outline-none focus:ring-brand-200"
            placeholder="0,00"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-normal text-gray-700">Status</label>
          <select
            value={form.status}
            onChange={handleChange('status')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-neutral-600 focus:outline-none focus:ring-brand-200"
          >
            <option value="ativo">Ativo</option>
            <option value="pausado">Pausado</option>
            <option value="encerrado">Encerrado</option>
          </select>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-normal text-gray-700">Início</label>
          <input
            type="date"
            value={form.inicio ?? ''}
            onChange={handleChange('inicio')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-neutral-600 focus:outline-none focus:ring-brand-200"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-normal text-gray-700">Fim</label>
          <input
            type="date"
            value={form.fim ?? ''}
            onChange={handleChange('fim')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-neutral-600 focus:outline-none focus:ring-brand-200"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-normal text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-normal text-gray-900 hover:bg-brand-600 disabled:opacity-60"
        >
          {submitting ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
