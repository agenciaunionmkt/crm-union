import { useState } from 'react'
import Input from './ui/Input'
import Button from './ui/Button'
import Badge from './ui/Badge'

const emptyForm = {
  cliente_id: '',
  titulo: '',
  descricao: '',
  status: 'a_fazer',
  prazo: '',
  responsavel_id: '',
}

export const statusOptions = [
  { value: 'a_fazer', label: 'A fazer' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'em_revisao', label: 'Em revisão' },
  { value: 'entregue', label: 'Entregue' },
]

export default function DemandForm({
  initialValues,
  clients,
  teamUsers,
  tags,
  onSubmit,
  onCancel,
  onDelete,
  submitting,
}) {
  const [form, setForm] = useState({
    ...emptyForm,
    ...initialValues,
    cliente_id: initialValues?.cliente_id ?? '',
    responsavel_id: initialValues?.responsavel_id ?? '',
    prazo: initialValues?.prazo ?? '',
  })
  const [selectedTagIds, setSelectedTagIds] = useState(
    (initialValues?.tags ?? []).map((tag) => tag.id)
  )
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loadingAI, setLoadingAI] = useState(false)

  async function generateDescriptionWithAI() {
    if (!form.titulo) {
      alert('Preencha o título primeiro')
      return
    }

    setLoadingAI(true)
    try {
      // Por enquanto, uma sugestão simples.
      // Pode ser integrado com uma API de IA real depois
      const sugestao = `Demanda: ${form.titulo}\n\nEscopo:\n- Análise inicial\n- Desenvolvimento\n- Testes\n- Entrega\n\nPrazo: ${form.prazo || 'A definir'}`
      setForm((prev) => ({ ...prev, descricao: sugestao }))
    } catch (error) {
      alert('Erro ao gerar sugestão')
    } finally {
      setLoadingAI(false)
    }
  }

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  function toggleTag(tagId) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    // Envia apenas colunas válidas da tabela demands — campos derivados do join
    // (responsavel, tags, id, created_at...) quebrariam o update.
    onSubmit(
      {
        cliente_id: form.cliente_id,
        titulo: form.titulo,
        descricao: form.descricao || null,
        status: form.status,
        prazo: form.prazo || null,
        responsavel_id: form.responsavel_id || null,
      },
      selectedTagIds
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Título */}
      <Input
        label="Título"
        required
        value={form.titulo}
        onChange={handleChange('titulo')}
        placeholder="Ex: Post para feed - lançamento de produto"
      />

      {/* Descrição */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-normal text-neutral-700 dark:text-neutral-300">
            Descrição
          </label>
          <button
            type="button"
            onClick={generateDescriptionWithAI}
            disabled={loadingAI || !form.titulo}
            className="text-xs font-normal text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 disabled:text-slate-400 transition-colors"
          >
            {loadingAI ? 'Gerando...' : 'Sugerir com IA'}
          </button>
        </div>
        <textarea
          rows={4}
          value={form.descricao ?? ''}
          onChange={handleChange('descricao')}
          className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-transparent text-neutral-900 dark:text-white text-sm font-normal focus:outline-none dark:focus:ring-emerald-400"
          placeholder="Detalhes da demanda"
        />
      </div>

      {/* Cliente & Responsável */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-normal text-neutral-700 dark:text-neutral-300">
            Cliente
          </label>
          <select
            required
            value={form.cliente_id}
            onChange={handleChange('cliente_id')}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-transparent dark:bg-transparent text-neutral-900 dark:text-white text-sm focus:outline-none dark:focus:ring-emerald-400"
          >
            <option value="">Selecione...</option>
            {(clients ?? []).map((client) => (
              <option key={client.id} value={client.id}>
                {client.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-normal text-neutral-700 dark:text-neutral-300">
            Responsável
          </label>
          <select
            value={form.responsavel_id}
            onChange={handleChange('responsavel_id')}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-transparent dark:bg-transparent text-neutral-900 dark:text-white text-sm focus:outline-none dark:focus:ring-emerald-400"
          >
            <option value="">Sem responsável</option>
            {(teamUsers ?? []).map((user) => (
              <option key={user.id} value={user.id}>
                {user.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Prazo */}
      <div>
        <label className="mb-1.5 block text-sm font-normal text-neutral-700 dark:text-neutral-300">
          Prazo
        </label>
        <input
          type="date"
          value={form.prazo ?? ''}
          onChange={handleChange('prazo')}
          className="w-full px-3 py-2 rounded-lg border border-white/15 bg-white/5 text-white text-sm focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 [color-scheme:dark]"
        />
      </div>

      {/* Status (seletor de pílulas) */}
      <div>
        <label className="mb-1.5 block text-sm font-normal text-neutral-700 dark:text-neutral-300">
          Status
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {statusOptions.map((option) => {
            const active = form.status === option.value
            const activeTone = {
              a_fazer: 'bg-white/10 text-white border-white/30',
              em_andamento: 'bg-violet-500/20 text-violet-200 border-violet-500/50',
              em_revisao: 'bg-yellow-400/20 text-yellow-200 border-yellow-400/50',
              entregue: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/50',
            }[option.value]
            return (
              <button
                type="button"
                key={option.value}
                onClick={() => setForm((prev) => ({ ...prev, status: option.value }))}
                className={`rounded-lg border px-3 py-2 text-xs font-normal transition-colors ${
                  active ? activeTone : 'border-white/15 text-neutral-300 hover:bg-white/5'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-neutral-200 dark:border-neutral-700">
        {onDelete && (
          <div>
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <p className="text-xs font-normal text-red-600 dark:text-red-400">Tem certeza?</p>
                <button
                  type="button"
                  onClick={() => {
                    onDelete()
                    setConfirmDelete(false)
                  }}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-normal text-white hover:bg-red-700 transition-colors"
                >
                  Excluir
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-red-300 dark:border-red-700 px-3 py-1.5 text-xs font-normal text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setConfirmDelete(true)}
              >
                Excluir demanda
              </Button>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Salvando...' : 'Salvar demanda'}
          </Button>
        </div>
      </div>
    </form>
  )
}
