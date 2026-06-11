import { forwardRef } from 'react'
import { useTheme } from '../../context/ThemeContext'

const Input = forwardRef(
  ({
    label,
    error,
    helpText,
    leftIcon,
    rightIcon,
    className = '',
    ...props
  }, ref) => {
    const { isDark } = useTheme()
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-normal text-neutral-700 dark:text-neutral-300">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-neutral-500 dark:text-neutral-400">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            className={`
              w-full px-4 py-2.5 rounded-lg border transition-all duration-200
              text-sm font-normal
              bg-transparent
              text-neutral-900 dark:text-white
              border-neutral-300 dark:border-neutral-600
              placeholder-neutral-500 dark:placeholder-neutral-400
              focus:outline-none focus:border-neutral-600
              disabled:bg-transparent
              disabled:text-neutral-500 dark:disabled:text-neutral-400
              disabled:cursor-not-allowed
              ${error ? 'border-red-500 dark:border-red-400' : ''}
              ${className}
            `}
            style={!isDark ? {
              backgroundColor: 'transparent',
              borderColor: '#d4d4d8',
              color: '#1a1a1a'
            } : {}}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 text-neutral-500 dark:text-neutral-400">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
        )}

        {helpText && !error && (
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{helpText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
