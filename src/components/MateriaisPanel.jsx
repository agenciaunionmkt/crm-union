import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload, FileText, Trash2, Download, Loader2 } from 'lucide-react'
import { listMateriais, createMaterial, deleteMaterial } from '../lib/api/materiais'
import { isImageUrl } from '../lib/api/storage'

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('pt-BR')
}

export default function MateriaisPanel({ clienteId, currentUser, canUpload = true }) {
  const queryClient = useQueryClient()
  const fileRef = useRef(null)
  const [expandImg, setExpandImg] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [erro, setErro] = useState('')

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ['materiais', clienteId],
    queryFn: () => listMateriais(clienteId),
    enabled: !!clienteId,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materiais', clienteId] }),
  })

  async function handlePick(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setUploading(true)
    setErro('')
    try {
      for (const file of files) {
        await createMaterial({ clienteId, file, enviadoPor: currentUser?.id })
      }
      queryClient.invalidateQueries({ queryKey: ['materiais', clienteId] })
    } catch (err) {
      setErro(err.message || 'Falha ao enviar arquivo')
    } finally {
      setUploading(false)
    }
  }

  const imagens = itens.filter((m) => isImageUrl(m.nome_arquivo || m.arquivo_url))
  const arquivos = itens.filter((m) => !isImageUrl(m.nome_arquivo || m.arquivo_url))

  return (
    <div>
      {/* Envio (só onde permitido — ex.: portal do cliente) */}
      {canUpload && (
        <>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface px-4 py-5 text-sm text-muted hover:bg-white/5 transition-colors">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{uploading ? 'Enviando...' : 'Enviar materiais (logo, fotos, PDFs...)'}</span>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={handlePick} disabled={uploading} />
          </label>
          {erro && <p className="mt-2 text-xs text-danger">{erro}</p>}
        </>
      )}

      {isLoading && <p className="mt-4 text-sm text-muted">Carregando...</p>}
      {!isLoading && itens.length === 0 && (
        <p className="mt-4 text-sm text-muted">Nenhum material enviado ainda.</p>
      )}

      {/* Imagens */}
      {imagens.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[11px] uppercase tracking-widest text-subtle">Imagens</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {imagens.map((m) => (
              <div key={m.id} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-2">
                <button type="button" onClick={() => setExpandImg(m.arquivo_url)} className="h-full w-full" title="Ampliar">
                  <img src={m.arquivo_url} alt={m.nome_arquivo} loading="lazy" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(m)}
                  className="absolute right-1 top-1 rounded-md bg-black/60 p-1 text-neutral-200 opacity-0 hover:text-danger group-hover:opacity-100 transition-opacity"
                  title="Remover"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Arquivos */}
      {arquivos.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[11px] uppercase tracking-widest text-subtle">Arquivos</p>
          <ul className="space-y-2">
            {arquivos.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                <FileText className="w-5 h-5 flex-shrink-0 text-subtle" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{m.nome_arquivo}</p>
                  <p className="text-xs text-subtle">{formatDate(m.created_at)}</p>
                </div>
                <a
                  href={m.arquivo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-foreground transition-colors"
                  title="Baixar"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(m)}
                  className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-danger transition-colors"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lightbox */}
      {expandImg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={() => setExpandImg(null)} role="presentation">
          <img src={expandImg} alt="Material ampliado" className="max-h-[90vh] max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          <button type="button" onClick={() => setExpandImg(null)} className="absolute right-4 top-4 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20">
            Fechar
          </button>
        </div>
      )}
    </div>
  )
}
