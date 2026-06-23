import { useEffect, useRef } from 'react'
import { useModalA11y } from '../../lib/useModalA11y'

export default function Modal({
  open = false,
  title,
  onClose,
  children,
  maxWidth = 'max-w-2xl',
  size = 'md',
}) {
  const panelRef = useRef(null)
  useModalA11y(open, panelRef, onClose)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop com blur sofisticado */}
      <div
        className="fixed inset-0 z-40 bg-black/75 transition-opacity duration-300 animate-in fade-in"
        role="presentation"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <div
          ref={panelRef}
          tabIndex={-1}
          className={`
            w-full ${maxWidth}
            rounded-2xl
            bg-surface
            shadow-2xl shadow-black/60
            max-h-[90vh]
            overflow-y-auto
            border border-border
            focus:outline-none
            animate-in scale-in-95 fade-in duration-300 zoom-in-95
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {title && (
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-6 py-5">
              <div>
                <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
                  {title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-foreground transition-colors"
                aria-label="Fechar modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Body */}
          <div className="px-6 py-5">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
