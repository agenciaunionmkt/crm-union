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
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-400 dark:border-neutral-500 px-3.5 py-2 text-xs font-normal text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/30 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>
          <button
            onClick={() => onMonthChange(new Date())}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-400 dark:border-neutral-500 px-3.5 py-2 text-xs font-normal text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/30 active:scale-95 transition-all"
          >
            <span>Hoje</span>
          </button>
          <button
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-400 dark:border-neutral-500 px-3.5 py-2 text-xs font-normal text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/30 active:scale-95 transition-all"
          >
            <span>Próximo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-300 dark:border-neutral-600/50 bg-transparent dark:bg-neutral-900 backdrop-blur-xl shadow-lg">
        <div className="grid grid-cols-7 gap-0 bg-neutral-200 dark:bg-transparent">
          {weekDays.map((day) => (
            <div key={day} className="bg-neutral-150 dark:bg-transparent/80 px-3 py-3 text-center text-xs font-normal text-neutral-700 dark:text-neutral-400 border-b border-neutral-300 dark:border-neutral-700">
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
                className={`min-h-32 border-b border-r border-neutral-300 dark:border-neutral-700 p-3 ${onDayClick ? 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors' : ''} ${
                  inMonth ? 'bg-transparent dark:bg-neutral-900' : 'bg-neutral-100 dark:bg-transparent/50 text-neutral-400'
                }`}
              >
                <p
                  className={`mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-normal ${
                    isToday ? 'border-2 border-emerald-500 dark:border-emerald-400 text-neutral-600 dark:text-neutral-400' : 'text-neutral-600 dark:text-neutral-400'
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
                      className={`truncate rounded px-2 py-1 text-[11px] font-normal ${
                        overdue
                          ? 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/40'
                          : 'bg-neutral-200 dark:bg-transparent/40 text-neutral-700 dark:text-neutral-300'
                      } ${
                        onCardClick
                          ? overdue
                            ? 'hover:bg-red-200 dark:hover:bg-red-500/25 cursor-pointer transition-colors'
                            : 'hover:bg-neutral-300 dark:hover:bg-neutral-600/50 cursor-pointer transition-colors'
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
