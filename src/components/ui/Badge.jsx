const variantClasses = {
  primary: 'bg-accent/10 text-accent',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  secondary: 'bg-white/5 text-muted',
  purple: 'bg-violet-500/15 text-violet-300',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs font-medium',
  md: 'px-2.5 py-1 text-xs font-medium',
  lg: 'px-3 py-1.5 text-sm font-medium',
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
    <span className={`inline-flex items-center gap-1 rounded-full ${variantClass} ${sizeClass} ${className}`}>
      {children}
    </span>
  )
}
