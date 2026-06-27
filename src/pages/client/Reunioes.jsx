import { useQuery } from '@tanstack/react-query'
import { Video, Calendar } from 'lucide-react'
import { listReunioes } from '../../lib/api/reunioes'

function formatHora(value) {
  return new Date(value).toLocaleString('pt-BR', {
    weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

export default function ClientReunioes() {
  const { data: reunioes = [], isLoading } = useQuery({ queryKey: ['reunioes'], queryFn: listReunioes })

  const agora = Date.now()
  const proximas = reunioes.filter((r) => new Date(r.inicio).getTime() >= agora - 60 * 60 * 1000)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Reuniões</h1>
        <p className="mt-1 text-sm text-muted">Suas reuniões agendadas com a agência</p>
      </div>

      <div className="glass rounded-2xl p-6">
        {isLoading && <p className="text-sm text-muted">Carregando...</p>}
        {!isLoading && proximas.length === 0 && (
          <p className="text-sm text-muted">Nenhuma reunião agendada no momento.</p>
        )}
        <div className="space-y-2">
          {proximas.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{r.titulo}</p>
                <p className="text-xs text-subtle capitalize">{formatHora(r.inicio)}</p>
                {r.descricao && <p className="mt-1 text-xs text-muted">{r.descricao}</p>}
              </div>
              {r.link && (
                <a
                  href={r.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground hover:opacity-90 transition-colors"
                >
                  <Video className="h-3.5 w-3.5" /> Meet
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
