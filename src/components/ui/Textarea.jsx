import { forwardRef } from 'react'
import { fieldBase, fieldBorder } from './Input'

const Textarea = forwardRef(
  ({ label, error, helpText, className = '', rows = 3, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-muted">{label}</label>
        )}

        <textarea
          ref={ref}
          rows={rows}
          className={`${fieldBase} ${fieldBorder(error)} resize-y ${className}`}
          {...props}
        />

        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        {helpText && !error && <p className="mt-1 text-xs text-neutral-400">{helpText}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea
