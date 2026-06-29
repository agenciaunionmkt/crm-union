import { useEffect, useState } from 'react'
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react'

// Suporta dois modos:
// 1. Multi-imagem: images=[{url, nome}] + index=N  (navegação prev/next)
// 2. Single (retrocompat): url + nome
export default function ImageLightbox({ images, index: initialIndex, url, nome, onClose }) {
  const imgs = images?.length ? images : url ? [{ url, nome }] : []
  const [idx, setIdx] = useState(initialIndex != null ? initialIndex : 0)

  // Sincroniza quando o índice inicial muda (novo lightbox aberto)
  useEffect(() => {
    if (initialIndex != null) setIdx(initialIndex)
  }, [initialIndex])

  const current = imgs[idx]
  const hasPrev = idx > 0
  const hasNext = idx < imgs.length - 1

  useEffect(() => {
    if (!current) return
    document.body.style.overflow = 'hidden'
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
      if (e.key === 'ArrowLeft' && hasPrev) setIdx((i) => i - 1)
      if (e.key === 'ArrowRight' && hasNext) setIdx((i) => i + 1)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [current, hasPrev, hasNext, onClose])

  if (!current) return null

  const downloadUrl =
    current.url + (current.url.includes('?') ? '&' : '?') + 'download' +
    (current.nome ? `=${encodeURIComponent(current.nome)}` : '')

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="presentation"
    >
      {/* Seta esquerda */}
      {hasPrev && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIdx((i) => i - 1) }}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/25 transition-colors"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Seta direita */}
      {hasNext && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIdx((i) => i + 1) }}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/25 transition-colors"
          aria-label="Próxima"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Barra superior */}
      <div
        className="absolute right-4 top-4 flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {imgs.length > 1 && (
          <span className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white/70">
            {idx + 1} / {imgs.length}
          </span>
        )}
        <a
          href={downloadUrl}
          download={current.nome || true}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20 transition-colors"
        >
          <Download className="w-4 h-4" /> Baixar
        </a>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4" /> Fechar
        </button>
      </div>

      {/* Imagem */}
      <img
        key={current.url}
        src={current.url}
        alt={current.nome || 'Imagem'}
        className="max-h-[88vh] max-w-full rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Nome do arquivo */}
      {current.nome && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-black/50 px-3 py-1 text-xs text-white/60">
          {current.nome}
        </p>
      )}
    </div>
  )
}
