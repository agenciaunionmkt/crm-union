import { forwardRef } from 'react'
import { useTheme } from '../../context/ThemeContext'

const TableWrapper = forwardRef(({ className = '', children, ...props }, ref) => {
  const { isDark } = useTheme()
  return (
    <div
      className="overflow-x-auto rounded-xl bg-neutral-50 dark:bg-neutral-900/40 backdrop-blur-xl border border-neutral-200 dark:border-neutral-700/50 shadow-lg"
      style={!isDark ? { backgroundColor: '#fafafa', borderColor: '#e4e4e7' } : {}}
    >
      <table
        ref={ref}
        className={`w-full text-sm ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  )
})

TableWrapper.displayName = 'Table'

export const Table = TableWrapper

Table.displayName = 'Table'

export const TableHead = forwardRef(({ className = '', children, ...props }, ref) => {
  const { isDark } = useTheme()
  return (
    <thead
      ref={ref}
      className={`
        border-b border-neutral-200 dark:border-neutral-700/50
        bg-neutral-100 dark:bg-transparent/50
        ${className}
      `}
      style={!isDark ? { backgroundColor: '#f4f4f5', borderColor: '#e4e4e7' } : {}}
      {...props}
    >
      {children}
    </thead>
  )
})

TableHead.displayName = 'TableHead'

export const TableBody = forwardRef(({ className = '', children, ...props }, ref) => (
  <tbody
    ref={ref}
    className={`divide-y divide-neutral-200 dark:divide-neutral-700/50 ${className}`}
    {...props}
  >
    {children}
  </tbody>
))

TableBody.displayName = 'TableBody'

export const TableRow = forwardRef(
  ({ className = '', isHeader = false, children, ...props }, ref) => {
    const { isDark } = useTheme()
    return (
      <tr
        ref={ref}
        className={`
          ${isHeader
            ? 'bg-neutral-100 dark:bg-transparent/50'
            : 'bg-neutral-50 dark:bg-neutral-900/20 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40 transition-colors'
          }
          ${className}
        `}
        style={!isDark ? {
          backgroundColor: isHeader ? '#f4f4f5' : '#fafafa'
        } : {}}
        {...props}
      >
        {children}
      </tr>
    )
  }
)

TableRow.displayName = 'TableRow'

export const TableHeader = forwardRef(
  ({ className = '', children, ...props }, ref) => (
    <th
      ref={ref}
      className={`
        px-4 py-3.5 text-left text-xs font-normal
        text-neutral-700 dark:text-neutral-300
        ${className}
      `}
      {...props}
    >
      {children}
    </th>
  )
)

TableHeader.displayName = 'TableHeader'

export const TableCell = forwardRef(
  ({ className = '', children, ...props }, ref) => (
    <td
      ref={ref}
      className={`
        px-4 py-3
        text-neutral-700 dark:text-neutral-400
        ${className}
      `}
      {...props}
    >
      {children}
    </td>
  )
)

TableCell.displayName = 'TableCell'

export default Table
