import { forwardRef } from 'react'

export const fieldBase =
  'w-full rounded-lg border bg-white/5 px-3 py-2.5 text-sm font-normal text-white placeholder-neutral-500 transition-colors focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed'

export function fieldBorder(error) {
  return error
    ? 'border-red-400/60 focus:border-red-400/60 focus:ring-red-500/20'
    : 'border-white/15 focus:border-yellow-400/50 focus:ring-yellow-400/20'
}

const Input = forwardRef(
  ({ label, error, helpText, leftIcon, rightIcon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-normal text-neutral-300">{label}</label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-neutral-400">{leftIcon}</span>
          )}

          <input
            ref={ref}
            className={`${fieldBase} ${fieldBorder(error)} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 text-neutral-400">{rightIcon}</span>
          )}
        </div>

        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        {helpText && !error && <p className="mt-1 text-xs text-neutral-400">{helpText}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
