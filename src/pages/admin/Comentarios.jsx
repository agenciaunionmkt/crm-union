import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { MessageSquare, ArrowRight } from 'lucide-react'
import { listCommentsFeed } from '../../lib/api/demandActivity'

function formatDateTime(value) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

export default function Comentarios() {
  const { data: feed = [], isLoading } = useQuery({
    queryKey: ['comments-feed'],
    queryFn: () => listCommentsFeed(),
  })

  // Só comentários de clientes
  const comentarios = feed.filter((c) => c.autor?.papel === 'cliente')

  // Marca como visto ao abrir (zera o badge no menu)
  useEffect(() => {
    if (comentarios.length) {
      try {
        localStorage.setItem('comentariosLastSeen', new Date().toISOString())
      } catch {
        /* ignore */
      }
    }
  }, [comentarios.length])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Comentários</h1>
        <p className="mt-1 text-sm text-muted">Comentários dos clientes nas demandas — pedidos de ajuste e dúvidas</p>
      </div>

      <div className="space-y-2">
        {isLoading && <p className="text-sm text-muted">Carregando...</p>}
        {!isLoading && comentarios.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted">
            Nenhum comentário de cliente ainda.
          </p>
        )}
        {comentarios.map((c) => (
          <Link
            key={c.id}
            to="/admin/demandas"
            state={{ openDemandId: c.demand_id }}
            className="block rounded-xl border border-border bg-surface px-4 py-3 hover:border-border-strong transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-subtle">
                  <span className="font-medium text-foreground">{c.autor?.nome ?? 'Cliente'}</span>
                  {c.demand?.client?.nome && <span>· {c.demand.client.nome}</span>}
                  <span>· {formatDateTime(c.created_at)}</span>
                </div>
                {c.demand?.titulo && (
                  <p className="mt-0.5 text-xs text-muted">Em: {c.demand.titulo}</p>
                )}
                <p className="mt-1 text-sm text-foreground">{c.mensagem}</p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-subtle" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
