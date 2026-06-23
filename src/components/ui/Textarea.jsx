import { forwardRef, useCallback, useLayoutEffect, useRef } from 'react'
import { fieldBase, fieldBorder } from './Input'

// Textarea que cresce com o conteúdo (sem rolagem interna). Isso facilita
// selecionar/copiar todo o texto no mobile, onde arrastar a seleção dentro de
// um campo com rolagem rola o modal em vez de estender a seleção.
const Textarea = forwardRef(
  ({ label, error, helpText, className = '', rows = 3, value, ...props }, ref) => {
    const innerRef = useRef(null)

    const setRefs = useCallback(
      (el) => {
        innerRef.current = el
        if (typeof ref === 'function') ref(el)
        else if (ref) ref.current = el
      },
      [ref]
    )

    const autoSize = useCallback(() => {
      const el = innerRef.current
      if (!el) return
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }, [])

    useLayoutEffect(() => {
      autoSize()
    }, [value, autoSize])

    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-muted">{label}</label>
        )}

        <textarea
          ref={setRefs}
          rows={rows}
          value={value}
          onInput={autoSize}
          className={`${fieldBase} ${fieldBorder(error)} resize-none overflow-hidden ${className}`}
          {...props}
        />

        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        {helpText && !error && <p className="mt-1 text-xs text-muted">{helpText}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea
