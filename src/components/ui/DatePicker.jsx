import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { fieldBase, fieldBorder } from './Input'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const SEMANA = ['D','S','T','Q','Q','S','S']

export default function DatePicker({ label, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const panelRef = useRef(null)

  const today = new Date()
  const selected = value ? new Date(value + 'T12:00:00') : null
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth())

  function open_() {
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) setPos({ top: rect.bottom + 4, left: rect.left })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (btnRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function pick(day) {
    const m = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onChange(`${viewYear}-${m}-${d}`)
    setOpen(false)
  }

  function prev() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function next() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const display = selected ? selected.toLocaleDateString('pt-BR') : ''

  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-medium text-muted">{label}</label>}
      <button
        ref={btnRef}
        type="button"
        onClick={open_}
        className={`${fieldBase} ${fieldBorder(false)} flex items-center justify-between text-left`}
      >
        <span className={selected ? 'text-foreground' : 'text-subtle'}>{display || 'Selecionar data'}</span>
        <Calendar className="h-4 w-4 flex-shrink-0 text-subtle" />
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, minWidth: 280 }}
          className="rounded-xl border border-border bg-surface p-4 shadow-xl shadow-black/60"
        >
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={prev} className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-foreground capitalize">
              {MESES[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={next} className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-foreground transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 text-center">
            {SEMANA.map((d, i) => <span key={i} className="py-1 text-[10px] font-medium text-subtle">{d}</span>)}
          </div>

          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }, (_, i) => <span key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const isSel = selected && selected.getDate() === day && selected.getMonth() === viewMonth && selected.getFullYear() === viewYear
              const isToday = today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => pick(day)}
                  className={`mx-auto my-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors
                    ${isSel ? 'bg-accent font-bold text-accent-foreground' : isToday ? 'font-semibold text-accent hover:bg-white/10' : 'text-foreground hover:bg-white/10'}`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
