import { useEffect, useRef, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'

const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export default function DatePicker({ value, onChange, placeholder = 'Selecione a data' }) {
  const selected = value ? parseISO(value) : null
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(selected || new Date())
  const ref = useRef(null)

  useEffect(() => {
    if (open) setView(selected || new Date())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const gridStart = startOfWeek(startOfMonth(view))
  const gridEnd = endOfWeek(endOfMonth(view))
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  function pick(day) {
    onChange(format(day, 'yyyy-MM-dd'))
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-left text-white focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
      >
        <span className={selected ? 'text-white' : 'text-muted'}>
          {selected ? format(selected, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : placeholder}
        </span>
        <span className="flex items-center gap-1">
          {selected && (
            <X
              className="w-4 h-4 text-muted hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
              }}
            />
          )}
          <Calendar className="w-4 h-4 text-muted" />
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-72 rounded-xl border border-border bg-surface p-3 shadow-2xl shadow-black/60">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView((v) => subMonths(v, 1))}
              className="rounded-md p-1.5 text-muted hover:bg-white/10 hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-normal capitalize text-white">
              {format(view, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button
              type="button"
              onClick={() => setView((v) => addMonths(v, 1))}
              className="rounded-md p-1.5 text-muted hover:bg-white/10 hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDays.map((d, i) => (
              <span key={i} className="py-1 text-[11px] text-muted">{d}</span>
            ))}
            {days.map((day) => {
              const inMonth = isSameMonth(day, view)
              const isSel = selected && isSameDay(day, selected)
              const isToday = isSameDay(day, new Date())
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => pick(day)}
                  className={`h-8 rounded-md text-xs transition-colors ${
                    isSel
                      ? 'bg-yellow-400 text-gray-900 font-semibold'
                      : isToday
                        ? 'border border-yellow-400/40 text-yellow-300 hover:bg-white/10'
                        : inMonth
                          ? 'text-subtle hover:bg-white/10'
                          : 'text-muted hover:bg-white/5'
                  }`}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => pick(new Date())}
              className="rounded-md px-2 py-1 text-xs text-yellow-300 hover:bg-white/5 transition-colors"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
