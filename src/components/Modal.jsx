import { useRef } from 'react'
import { useModalA11y } from '../lib/useModalA11y'

export default function Modal({ open, title, onClose, children, maxWidth = 'max-w-lg' }) {
  const panelRef = useRef(null)
  useModalA11y(open, panelRef, onClose)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
        role="presentation"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative w-full ${maxWidth} max-h-[90vh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl shadow-black/60 focus:outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border bg-surface px-6 py-5 flex-shrink-0">
          <h2 className="font-display text-lg font-bold tracking-tight text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-foreground transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}
