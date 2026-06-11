function formatDate(value) {
  if (!value) return null
  const [year, month, day] = value.split('-')
  return `${day}/${month}`
}

export default function DemandCard({ demand, onClick, draggable, onDragStart }) {
  return (
    <div
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      className="cursor-pointer rounded-lg border border-gray-200 bg-transparent p-3 shadow-sm hover:border-gray-300"
    >
      <p className="text-sm font-normal text-gray-900">{demand.titulo}</p>
      <p className="mt-1 text-xs text-gray-500">{demand.titulo ? 'Demanda' : 'Sem cliente'}</p>

      {demand.tags?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {demand.tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full px-2 py-0.5 text-[10px] font-normal text-white"
              style={{ backgroundColor: tag.cor }}
            >
              {tag.nome}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
        <span>{demand.responsavel?.nome ?? 'Sem responsável'}</span>
        {demand.prazo && <span>{formatDate(demand.prazo)}</span>}
      </div>
    </div>
  )
}
