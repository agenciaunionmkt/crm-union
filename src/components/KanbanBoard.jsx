import { statusOptions } from './DemandForm'
import DemandCard from './DemandCard'

export default function KanbanBoard({ demands, onCardClick, onStatusChange }) {
  function handleDrop(e, status) {
    e.preventDefault()
    const demandId = e.dataTransfer.getData('text/plain')
    if (demandId) onStatusChange(demandId, status)
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statusOptions.map((column) => {
        const items = demands.filter((d) => d.status === column.value)
        return (
          <div
            key={column.value}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, column.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 p-3"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-sm font-normal text-gray-700">{column.label}</h3>
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                {items.length}
              </span>
            </div>
            <div className="space-y-2">
              {items.map((demand) => (
                <DemandCard
                  key={demand.id}
                  demand={demand}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', demand.id)}
                  onClick={() => onCardClick(demand)}
                />
              ))}
              {items.length === 0 && (
                <p className="px-1 py-2 text-xs text-gray-400">Nenhuma demanda</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
