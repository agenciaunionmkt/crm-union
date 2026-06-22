import { forwardRef } from 'react'

const variantClasses = {
  primary: 'bg-accent text-accent-foreground font-medium hover:opacity-90 active:scale-[0.98]',
  secondary: 'bg-surface text-foreground border border-border hover:border-border-strong active:scale-[0.98]',
  outline: 'border border-border-strong text-foreground bg-transparent hover:bg-white/5 active:scale-[0.98]',
  ghost: 'text-foreground hover:bg-white/5 active:scale-[0.98]',
  danger: 'bg-danger text-white hover:opacity-90 active:scale-[0.98]',
}

const sizeClasses = {
  xs: 'h-8 px-2.5 text-xs',
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[15px]',
}

const Button = forwardRef(
  ({
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    className = '',
    children,
    ...props
  }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed'

    const variantClass = variantClasses[variant] || variantClasses.primary
    const sizeClass = sizeClasses[size] || sizeClasses.md

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseClasses} ${variantClass} ${sizeClass} ${className}`}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
