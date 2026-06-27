import { forwardRef } from 'react'
import { fieldBase, fieldBorder } from './Input'

const Select = forwardRef(
  ({ label, error, helpText, className = '', children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-muted">{label}</label>
        )}

        <select
          ref={ref}
          className={`${fieldBase} ${fieldBorder(error)} [color-scheme:dark] ${className}`}
          {...props}
        >
          {children}
        </select>

        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        {helpText && !error && <p className="mt-1 text-xs text-muted">{helpText}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
