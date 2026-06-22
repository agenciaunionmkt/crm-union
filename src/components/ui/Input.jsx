import { forwardRef } from 'react'

export const fieldBase =
  'w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-subtle transition-colors outline-none disabled:opacity-60 disabled:cursor-not-allowed'

export function fieldBorder(error) {
  return error
    ? 'border-danger focus:border-danger'
    : 'border-border focus:border-accent'
}

const Input = forwardRef(
  ({ label, error, helpText, leftIcon, rightIcon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-muted">{label}</label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-subtle">{leftIcon}</span>
          )}

          <input
            ref={ref}
            className={`${fieldBase} ${fieldBorder(error)} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 text-subtle">{rightIcon}</span>
          )}
        </div>

        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        {helpText && !error && <p className="mt-1 text-xs text-muted">{helpText}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
