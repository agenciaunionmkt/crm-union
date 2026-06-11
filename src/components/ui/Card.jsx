import { forwardRef } from 'react'

const Card = forwardRef(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-transparent/10 dark:bg-slate-800/40 backdrop-blur-2xl border border-white/20 dark:border-slate-700/40 shadow-2xl hover:shadow-3xl hover:bg-transparent/15',
      elevated: 'bg-transparent/20 dark:bg-slate-800/60 backdrop-blur-2xl border border-white/30 dark:border-slate-700/50 shadow-2xl hover:shadow-3xl',
      glass: 'bg-transparent/5 dark:bg-slate-900/30 backdrop-blur-3xl border border-white/10 dark:border-slate-700/30 shadow-2xl hover:shadow-3xl',
      soft: 'bg-slate-50/30 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/30 dark:border-slate-700/30 shadow-lg',
    }

    const variantClass = variants[variant] || variants.default

    return (
      <div
        ref={ref}
        className={`rounded-xl transition-all duration-200 ${variantClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export const CardHeader = forwardRef(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`px-5 py-4 border-b border-white/10 dark:border-slate-700/20 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
)

CardHeader.displayName = 'CardHeader'

export const CardBody = forwardRef(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`px-5 py-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
)

CardBody.displayName = 'CardBody'

export const CardFooter = forwardRef(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`px-5 py-4 border-t border-white/10 dark:border-slate-700/20 flex justify-end gap-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
)

CardFooter.displayName = 'CardFooter'

export default Card
