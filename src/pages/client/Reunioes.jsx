import { useQuery } from '@tanstack/react-query'
import { CalendarPlus, Clock } from 'lucide-react'
import { listReunioes } from '../../lib/api/reunioes'

export default function ClientReunioes() {
  const { data: reunioes = [], isLoading } = useQuery({ queryKey: ['reunioes'], queryFn: listReunioes })

  const agora = Date.now()
  const proximas = reunioes.filter((r) => new Date(r.inicio).getTime() >= agora - 60 * 60 * 1000)
  const passadas = reunioes.filter((r) => new Date(r.inicio).getTime() < agora - 60 * 60 * 1000)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Reuniões</h1>
        <p className="mt-1 text-sm text-muted">Suas reuniões agendadas com a agência</p>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-widest text-subtle">Próximas</p>
        {isLoading && <p className="text-sm text-muted">Carregando...</p>}
        {!isLoading && proximas.length === 0 && (
          <p className="text-sm text-muted">Nenhuma reunião agendada no momento.</p>
        )}
        {proximas.map((r) => {
          const start = new Date(r.inicio)
          const mes = start.toLocaleDateString('pt-BR', { month: 'short' })
          const hora = start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          return (
            <div key={r.id} className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
              <div className="flex w-14 flex-shrink-0 flex-col items-center rounded-lg bg-surface-2 py-2">
                <span className="text-[10px] uppercase tracking-widest text-subtle">{mes}</span>
                <span className="font-display text-2xl font-black leading-none text-foreground">{start.getDate()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{r.titulo}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-subtle">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {hora}
                  </span>
                  {r.descricao && <span className="truncate max-w-xs">{r.descricao}</span>}
                </div>
              </div>
              {r.link && (
                <a href={r.link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs text-foreground hover:bg-white/5 transition-colors">
                  <CalendarPlus className="h-3.5 w-3.5" /> Calendário
                </a>
              )}
            </div>
          )
        })}
      </div>

      {passadas.length > 0 && (
        <div className="mt-8 space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-widest text-subtle">Realizadas</p>
          {passadas.slice(0, 5).map((r) => {
            const start = new Date(r.inicio)
            const mes = start.toLocaleDateString('pt-BR', { month: 'short' })
            const hora = start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            return (
              <div key={r.id} className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 opacity-50">
                <div className="flex w-14 flex-shrink-0 flex-col items-center rounded-lg bg-surface-2 py-2">
                  <span className="text-[10px] uppercase tracking-widest text-subtle">{mes}</span>
                  <span className="font-display text-2xl font-black leading-none text-foreground">{start.getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{r.titulo}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-subtle">
                    <Clock className="h-3 w-3" />
                    {hora}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
