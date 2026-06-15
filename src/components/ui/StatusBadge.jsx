// Badge de status reutilizável. Passe os mapas de labels/styles do lib/status.
export default function StatusBadge({ status, labels, styles, className = '' }) {
  if (!status) return null
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-normal ${styles[status] ?? ''} ${className}`}>
      {labels[status] ?? status}
    </span>
  )
}
