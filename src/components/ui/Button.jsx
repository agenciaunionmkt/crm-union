import { forwardRef } from 'react'

const variantClasses = {
  primary: `
    bg-yellow-400 text-gray-900 font-semibold
    border border-yellow-300/50
    hover:bg-yellow-500 hover:shadow-lg hover:shadow-yellow-400/10
    active:scale-95
    transition-all duration-200
  `,
  secondary: `
    bg-neutral-200 backdrop-blur-sm text-neutral-900
    border border-neutral-300
    hover:bg-neutral-300 hover:shadow-md
    dark:bg-transparent dark:text-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-600
    active:scale-95
    transition-all duration-200
  `,
  outline: `
    border border-white/15 text-neutral-300
    bg-transparent
    hover:bg-white/5 hover:border-white/30
    active:scale-95
    transition-all duration-200
  `,
  ghost: `
    text-neutral-600 hover:bg-neutral-100/60
    dark:text-neutral-300 dark:hover:bg-neutral-700/40
    active:scale-95
    transition-all duration-200
  `,
  danger: `
    bg-red-500 backdrop-blur-sm text-white
    border border-red-400/40
    hover:bg-red-600 hover:shadow-lg
    active:scale-95
    transition-all duration-200
  `,
}

const sizeClasses = {
  xs: 'px-2.5 py-1.5 text-xs font-normal rounded-lg',
  sm: 'px-3 py-2 text-xs font-normal rounded-lg',
  md: 'px-4 py-2.5 text-sm font-normal rounded-lg',
  lg: 'px-5 py-3 text-sm font-normal rounded-lg',
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
    const baseClasses = `
      inline-flex items-center justify-center gap-2
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400/50
      dark:focus:ring-offset-neutral-900
      disabled:opacity-50 disabled:cursor-not-allowed
      transition-all duration-200
    `

    const variantClass = variantClasses[variant] || variantClasses.primary
    const sizeClass = sizeClasses[size] || sizeClasses.md

    const finalClassName = `${baseClasses} ${variantClass} ${sizeClass} ${className}`.replace(/\s+/g, ' ')

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={finalClassName}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
