import { useState } from 'react'
import Input from './ui/Input'
import Select from './ui/Select'
import Textarea from './ui/Textarea'
import Button from './ui/Button'
import DatePicker from './DatePicker'

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
  { value: 'entregue', label: 'Aguardando aprovação' },
  { value: 'aprovado', label: 'Aprovado' },
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
  formId,
  hideActions = false,
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
      const cliente = (clients ?? []).find((c) => c.id === form.cliente_id)
      const res = await fetch('/api/sugerir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: form.titulo, contexto: cliente?.nome }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Não foi possível gerar a sugestão')
      setForm((prev) => ({ ...prev, descricao: data.texto || prev.descricao }))
    } catch (error) {
      alert(error.message || 'Erro ao gerar sugestão')
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
    <form id={formId} onSubmit={handleSubmit} className="space-y-6">
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
          <label className="block text-sm font-normal text-neutral-300">
            Descrição
          </label>
          <button
            type="button"
            onClick={generateDescriptionWithAI}
            disabled={loadingAI || !form.titulo}
            className="text-xs font-normal text-yellow-300 hover:text-yellow-200 disabled:text-neutral-500 transition-colors"
          >
            {loadingAI ? 'Gerando...' : 'Sugerir com IA'}
          </button>
        </div>
        <Textarea
          rows={4}
          value={form.descricao ?? ''}
          onChange={handleChange('descricao')}
          placeholder="Detalhes da demanda"
        />
      </div>

      {/* Cliente & Responsável */}
      <div className="grid grid-cols-2 gap-4">
        <Select label="Cliente" required value={form.cliente_id} onChange={handleChange('cliente_id')}>
          <option value="">Selecione...</option>
          {(clients ?? []).map((client) => (
            <option key={client.id} value={client.id}>
              {client.nome}
            </option>
          ))}
        </Select>
        <Select label="Responsável" value={form.responsavel_id} onChange={handleChange('responsavel_id')}>
          <option value="">Sem responsável</option>
          {(teamUsers ?? []).map((user) => (
            <option key={user.id} value={user.id}>
              {user.nome}
            </option>
          ))}
        </Select>
      </div>

      {/* Prazo */}
      <div>
        <label className="mb-1.5 block text-sm font-normal text-neutral-300">
          Prazo
        </label>
        <DatePicker
          value={form.prazo ?? ''}
          onChange={(v) => setForm((prev) => ({ ...prev, prazo: v }))}
          placeholder="Selecione o prazo"
        />
      </div>

      {/* Status (seletor de pílulas) */}
      <div>
        <label className="mb-1.5 block text-sm font-normal text-neutral-300">
          Status
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {statusOptions.map((option) => {
            const active = form.status === option.value
            const activeTone = {
              a_fazer: 'bg-white/10 text-white border-white/30',
              em_andamento: 'bg-violet-500/20 text-violet-200 border-violet-500/50',
              em_revisao: 'bg-yellow-400/20 text-yellow-200 border-yellow-400/50',
              entregue: 'bg-blue-500/20 text-blue-200 border-blue-500/50',
              aprovado: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/50',
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
      {!hideActions && (
      <div className="flex items-center justify-between pt-6 border-t border-white/10">
        {onDelete && (
          <div>
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <p className="text-xs font-normal text-red-400">Tem certeza?</p>
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
                  className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-normal text-red-400 hover:bg-red-500/10 transition-colors"
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
      )}
    </form>
  )
}
