import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  listClientNotes,
  createClientNote,
  updateClientNote,
  deleteClientNote,
} from '../lib/api/notes'

function formatDateTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Anotações livres do cliente: fichas técnicas, receitas, informações do WhatsApp etc.
export default function NotesPanel({ clienteId }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(null) // null | 'new' | note
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [openId, setOpenId] = useState(null)

  const { data: notes, isLoading, error } = useQuery({
    queryKey: ['client-notes', clienteId],
    queryFn: () => listClientNotes(clienteId),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['client-notes', clienteId] })

  const saveMutation = useMutation({
    mutationFn: () =>
      editing === 'new'
        ? createClientNote(clienteId, { titulo, conteudo })
        : updateClientNote(editing.id, { titulo, conteudo }),
    onSuccess: () => {
      invalidate()
      closeForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteClientNote,
    onSuccess: invalidate,
  })

  function openNew() {
    setEditing('new')
    setTitulo('')
    setConteudo('')
  }

  function openEdit(note) {
    setEditing(note)
    setTitulo(note.titulo)
    setConteudo(note.conteudo ?? '')
  }

  function closeForm() {
    setEditing(null)
    setTitulo('')
    setConteudo('')
  }

  function handleDelete(note) {
    if (window.confirm(`Remover a anotação "${note.titulo}"?`)) {
      deleteMutation.mutate(note.id)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!titulo.trim()) return
    saveMutation.mutate()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          Fichas técnicas, receitas, informações passadas pelo cliente — tudo organizado por título.
        </p>
        {!editing && (
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground hover:opacity-90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Nova anotação
          </button>
        )}
      </div>

      {editing && (
        <form onSubmit={handleSubmit} className="mt-4 rounded-2xl border border-border bg-surface p-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-normal text-subtle">Título *</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Ficha técnica — Pizzas"
              autoFocus
              className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm text-foreground placeholder-neutral-500 focus:border-accent/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-normal text-subtle">Conteúdo</label>
            <textarea
              rows={10}
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder={'Cole aqui as informações do cliente...\n\nEx:\nPIZZA DE CALABRESA:\n300 g de queijo mussarela\n150 g de calabresa...'}
              className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm text-foreground placeholder-neutral-500 focus:border-accent/50 focus:outline-none resize-y"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending || !titulo.trim()}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50 transition-colors"
            >
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
          {saveMutation.error && (
            <p className="text-xs text-danger">{saveMutation.error.message}</p>
          )}
        </form>
      )}

      <div className="mt-4 space-y-3">
        {isLoading && <p className="text-sm text-muted">Carregando anotações...</p>}
        {error && <p className="text-sm text-danger">Erro ao carregar: {error.message}</p>}
        {!isLoading && !editing && (notes ?? []).length === 0 && (
          <p className="py-8 text-center text-sm text-muted">
            Nenhuma anotação ainda. Clique em "Nova anotação" para registrar a primeira.
          </p>
        )}
        {(notes ?? []).map((note) => {
          const open = openId === note.id
          return (
            <div key={note.id} className="rounded-2xl border border-border bg-surface">
              <div className="flex items-center justify-between gap-3 p-4">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : note.id)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <ChevronDown
                    className={`h-4 w-4 flex-shrink-0 text-muted transition-transform ${open ? '' : '-rotate-90'}`}
                  />
                  <div>
                    <h3 className="font-semibold text-foreground">{note.titulo}</h3>
                    <p className="mt-0.5 text-[11px] text-muted">
                      Atualizado em {formatDateTime(note.updated_at)}
                    </p>
                  </div>
                </button>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(note)}
                    className="p-1.5 rounded text-muted hover:text-foreground transition-colors"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(note)}
                    className="p-1.5 rounded text-muted hover:text-danger transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {open && note.conteudo && (
                <pre className="whitespace-pre-wrap border-t border-border px-4 py-3 font-sans text-sm text-subtle">
                  {note.conteudo}
                </pre>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
