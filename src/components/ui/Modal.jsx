import { useEffect } from 'react'

export default function Modal({
  open = false,
  title,
  onClose,
  children,
  maxWidth = 'max-w-2xl',
  size = 'md',
}) {
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
        className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        role="presentation"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <div
          className={`
            w-full ${maxWidth}
            rounded-2xl
            bg-[#13101c]/95 backdrop-blur-2xl
            shadow-2xl shadow-black/50
            max-h-[90vh]
            overflow-y-auto
            border border-white/10
            animate-in scale-in-95 fade-in duration-300 zoom-in-95
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {title && (
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#13101c]/95 backdrop-blur-2xl px-6 py-5">
              <div>
                <h2 className="text-xl font-normal text-white">
                  {title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors hover:-rotate-90 duration-300"
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
