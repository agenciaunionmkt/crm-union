import { useEffect } from 'react'
import { X, Download } from 'lucide-react'

// Visualizador de imagem em overlay (mesma tela), com opção de baixar.
// Use em qualquer lugar que precise abrir uma imagem.
export default function ImageLightbox({ url, nome, onClose }) {
  useEffect(() => {
    if (!url) return
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [url, onClose])

  if (!url) return null

  // O parâmetro ?download faz o Storage do Supabase enviar como anexo (baixa em vez de abrir)
  const downloadUrl =
    url + (url.includes('?') ? '&' : '?') + 'download' + (nome ? `=${encodeURIComponent(nome)}` : '')

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div className="absolute right-4 top-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <a
          href={downloadUrl}
          download={nome || true}
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
      <img
        src={url}
        alt={nome || 'Imagem'}
        className="max-h-[88vh] max-w-full rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
