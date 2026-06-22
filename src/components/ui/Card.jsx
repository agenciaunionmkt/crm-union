import { forwardRef } from 'react'

const Card = forwardRef(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-surface border border-border',
      elevated: 'bg-surface-2 border border-border',
      glass: 'bg-surface border border-border',
      soft: 'bg-surface border border-border',
    }

    const variantClass = variants[variant] || variants.default

    return (
      <div
        ref={ref}
        className={`rounded-2xl transition-colors duration-200 ${variantClass} ${className}`}
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
    <div ref={ref} className={`px-5 py-4 border-b border-border ${className}`} {...props}>
      {children}
    </div>
  )
)

CardHeader.displayName = 'CardHeader'

export const CardBody = forwardRef(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`px-5 py-4 ${className}`} {...props}>
      {children}
    </div>
  )
)

CardBody.displayName = 'CardBody'

export const CardFooter = forwardRef(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`px-5 py-4 border-t border-border flex justify-end gap-2 ${className}`} {...props}>
      {children}
    </div>
  )
)

CardFooter.displayName = 'CardFooter'

export default Card
