import { useEffect, useRef } from 'react'
import { useModalA11y } from '../../lib/useModalA11y'

export default function Modal({
  open = false,
  title,
  onClose,
  children,
  maxWidth = 'max-w-2xl',
}) {
  const panelRef = useRef(null)
  useModalA11y(open, panelRef, onClose)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/75 animate-in fade-in duration-200"
        onClick={onClose}
        role="presentation"
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <div
          ref={panelRef}
          tabIndex={-1}
          className={`relative w-full ${maxWidth} max-h-[90vh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl shadow-black/60 focus:outline-none animate-in zoom-in-95 fade-in duration-200`}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-6 py-5">
              <h2 className="font-display text-lg font-bold tracking-tight text-foreground">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-foreground transition-colors"
                aria-label="Fechar"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
