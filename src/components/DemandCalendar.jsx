import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function DemandCalendar({
  demands,
  currentMonth,
  onMonthChange,
  onDayClick,
  onCardClick,
}) {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const gridStart = startOfWeek(monthStart)
  const gridEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  function demandsForDay(day) {
    return demands.filter((d) => d.prazo && isSameDay(new Date(`${d.prazo}T00:00:00`), day))
  }

  const hojeStr = format(new Date(), 'yyyy-MM-dd')
  function isOverdue(demand) {
    return demand.prazo && demand.prazo < hojeStr && demand.status !== 'entregue'
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-center py-4 px-6 relative">
        <h2 className="text-lg font-normal capitalize text-neutral-900 dark:text-white">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex gap-3 absolute right-6">
          <button
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3.5 py-2 text-xs font-normal text-neutral-300 hover:bg-white/5 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>
          <button
            onClick={() => onMonthChange(new Date())}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3.5 py-2 text-xs font-normal text-neutral-300 hover:bg-white/5 active:scale-95 transition-all"
          >
            <span>Hoje</span>
          </button>
          <button
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3.5 py-2 text-xs font-normal text-neutral-300 hover:bg-white/5 active:scale-95 transition-all"
          >
            <span>Próximo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <div className="grid grid-cols-7 gap-0">
          {weekDays.map((day) => (
            <div key={day} className="px-3 py-3 text-center text-xs font-normal text-neutral-400 border-b border-white/10">
              {day}
            </div>
          ))}

          {days.map((day) => {
            const items = demandsForDay(day)
            const inMonth = isSameMonth(day, currentMonth)
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={day.toISOString()}
                onClick={onDayClick ? () => onDayClick(day) : undefined}
                className={`min-h-32 border-b border-r border-white/10 p-3 ${onDayClick ? 'cursor-pointer hover:bg-white/5 transition-colors' : ''} ${
                  inMonth ? 'bg-transparent' : 'bg-black/20 text-neutral-600'
                }`}
              >
                <p
                  className={`mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-normal ${
                    isToday ? 'bg-yellow-400 text-gray-900 font-semibold' : 'text-neutral-400'
                  }`}
                >
                  {format(day, 'd')}
                </p>
                <div className="space-y-1">
                  {items.slice(0, 3).map((demand) => {
                    const overdue = isOverdue(demand)
                    return (
                    <div
                      key={demand.id}
                      onClick={
                        onCardClick
                          ? (e) => {
                              e.stopPropagation()
                              onCardClick(demand)
                            }
                          : undefined
                      }
                      className={`truncate rounded-md border px-2 py-1.5 text-[11px] font-normal ${
                        overdue
                          ? 'bg-red-500/15 text-red-300 border-red-500/40'
                          : 'bg-white/5 text-neutral-200 border-white/10'
                      } ${
                        onCardClick
                          ? overdue
                            ? 'hover:bg-red-500/25 cursor-pointer transition-colors'
                            : 'hover:bg-white/10 hover:border-white/20 cursor-pointer transition-colors'
                          : ''
                      }`}
                      title={overdue ? `${demand.titulo} — atrasada` : demand.titulo}
                    >
                      {demand.titulo}
                    </div>
                    )
                  })}
                  {items.length > 3 && (
                    <p className="px-2 text-[11px] text-neutral-500 dark:text-neutral-400">+{items.length - 3} mais</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
