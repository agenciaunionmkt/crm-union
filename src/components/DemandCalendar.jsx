import { useState } from 'react'
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
import Modal from './Modal'

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function DemandCalendar({
  demands,
  currentMonth,
  onMonthChange,
  onDayClick,
  onCardClick,
  commentDemandIds = [],
}) {
  const comentadas = new Set(commentDemandIds)
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
    return (
      demand.prazo &&
      demand.prazo < hojeStr &&
      !['entregue', 'aprovado', 'concluido'].includes(demand.status)
    )
  }
  function isDone(demand) {
    return demand.status === 'aprovado'
  }
  function isConcluido(demand) {
    return demand.status === 'concluido'
  }
  function isAwaiting(demand) {
    return demand.status === 'entregue'
  }
  function toneFor(demand) {
    if (isConcluido(demand)) return 'bg-green-500/25 text-green-200 border-green-500/50'
    if (isDone(demand)) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
    if (isAwaiting(demand)) return 'bg-blue-500/15 text-blue-300 border-blue-500/40'
    if (isOverdue(demand)) return 'bg-red-500/15 text-red-300 border-red-500/40'
    return 'bg-white/5 text-subtle border-white/10'
  }
  function iniciaisDe(demand) {
    const nome = demand.responsavel?.nome
    return nome ? nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() : null
  }

  const [dayModal, setDayModal] = useState(null)

  return (
    <div>
      <div className="mb-4 flex items-center justify-center py-4 px-6 relative">
        <h2 className="text-lg font-normal capitalize text-foreground">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex gap-3 absolute right-6">
          <button
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3.5 py-2 text-xs font-normal text-subtle hover:bg-white/5 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>
          <button
            onClick={() => onMonthChange(new Date())}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3.5 py-2 text-xs font-normal text-subtle hover:bg-white/5 active:scale-95 transition-all"
          >
            <span>Hoje</span>
          </button>
          <button
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3.5 py-2 text-xs font-normal text-subtle hover:bg-white/5 active:scale-95 transition-all"
          >
            <span>Próximo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <div className="grid grid-cols-7 gap-0 min-w-[700px]">
          {weekDays.map((day) => (
            <div key={day} className="px-3 py-3 text-center text-xs font-normal text-muted border-b border-white/10">
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
                  inMonth ? 'bg-transparent' : 'bg-black/20 text-muted'
                }`}
              >
                <p
                  className={`mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-normal ${
                    isToday ? 'bg-yellow-400 text-gray-900 font-semibold' : 'text-muted'
                  }`}
                >
                  {format(day, 'd')}
                </p>
                <div className="space-y-1">
                  {items.slice(0, 3).map((demand) => {
                    const overdue = isOverdue(demand)
                    const done = isDone(demand)
                    const concluido = isConcluido(demand)
                    const awaiting = isAwaiting(demand)
                    const tone = toneFor(demand)
                    const hover = concluido
                      ? 'hover:bg-green-500/35'
                      : done
                        ? 'hover:bg-emerald-500/25'
                        : awaiting
                          ? 'hover:bg-blue-500/25'
                          : overdue
                            ? 'hover:bg-red-500/25'
                            : 'hover:bg-white/10 hover:border-white/20'
                    const nome = demand.responsavel?.nome
                    const iniciais = nome
                      ? nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
                      : null
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
                      className={`relative rounded-lg border px-2.5 py-2 ${tone} ${
                        onCardClick ? `${hover} cursor-pointer transition-colors` : ''
                      }`}
                      title={concluido ? `${demand.titulo} — concluída` : done ? `${demand.titulo} — aprovada` : awaiting ? `${demand.titulo} — aguardando aprovação` : overdue ? `${demand.titulo} — atrasada` : demand.titulo}
                    >
                      {comentadas.has(demand.id) && (
                        <span
                          className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-yellow-400 ring-2 ring-[#161618]"
                          title="Novo comentário"
                        />
                      )}
                      <p className="text-xs font-normal leading-snug line-clamp-2">{demand.titulo}</p>
                      <div className="mt-1.5 flex items-center justify-end">
                        {iniciais ? (
                          <span
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-[10px] font-semibold text-accent"
                            title={nome}
                          >
                            {iniciais}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted">Sem responsável</span>
                        )}
                      </div>
                    </div>
                    )
                  })}
                  {items.length > 3 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDayModal(day)
                      }}
                      className="w-full rounded-md px-2 py-1 text-left text-[11px] text-muted hover:bg-white/5 hover:text-foreground transition-colors"
                    >
                      +{items.length - 3} mais
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Demandas sem prazo (não aparecem no grid; ficam aqui para abrir/editar/remover) */}
      {demands.some((d) => !d.prazo) && (
        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-widest text-subtle">Sem prazo definido</p>
          <div className="flex flex-wrap gap-2">
            {demands
              .filter((d) => !d.prazo)
              .map((demand) => (
                <button
                  key={demand.id}
                  type="button"
                  onClick={() => onCardClick?.(demand)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${toneFor(demand)} ${onCardClick ? 'cursor-pointer hover:brightness-110' : ''}`}
                >
                  <span>{demand.titulo}</span>
                  {iniciaisDe(demand) && (
                    <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-semibold text-accent">
                      {iniciaisDe(demand)}
                    </span>
                  )}
                </button>
              ))}
          </div>
        </div>
      )}

      <Modal
        open={!!dayModal}
        title={dayModal ? format(dayModal, "dd 'de' MMMM", { locale: ptBR }) : ''}
        onClose={() => setDayModal(null)}
        maxWidth="max-w-md"
      >
        <div className="space-y-2">
          {dayModal &&
            demandsForDay(dayModal).map((demand) => (
              <button
                key={demand.id}
                type="button"
                onClick={() => {
                  setDayModal(null)
                  onCardClick?.(demand)
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${toneFor(demand)} hover:brightness-110`}
              >
                <span className="text-sm font-normal">{demand.titulo}</span>
                {iniciaisDe(demand) && (
                  <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-semibold text-accent">
                    {iniciaisDe(demand)}
                  </span>
                )}
              </button>
            ))}
        </div>
      </Modal>
    </div>
  )
}
