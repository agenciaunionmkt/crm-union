const variantClasses = {
  primary: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  secondary: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs font-normal',
  md: 'px-2.5 py-1 text-sm font-normal',
  lg: 'px-3 py-1.5 text-sm font-normal',
}

export default function Badge({
  variant = 'primary',
  size = 'sm',
  children,
  className = '',
}) {
  const variantClass = variantClasses[variant] || variantClasses.primary
  const sizeClass = sizeClasses[size] || sizeClasses.sm

  return (
    <span className={`inline-flex items-center rounded-full ${variantClass} ${sizeClass} ${className}`}>
      {children}
    </span>
  )
}
