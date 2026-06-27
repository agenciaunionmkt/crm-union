import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Video, X, Bell } from 'lucide-react'
import { listReunioes } from '../lib/api/reunioes'
import { playSound } from '../lib/sound'

function jaDisparou(key) {
  try { return localStorage.getItem(`alarm_${key}`) === '1' } catch { return false }
}
function marcarDisparado(key) {
  try { localStorage.setItem(`alarm_${key}`, '1') } catch { /* ignore */ }
}

function formatHora(value) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

export default function MeetingAlarm() {
  const [alerta, setAlerta] = useState(null)

  const { data: reunioes = [] } = useQuery({
    queryKey: ['reunioes'],
    queryFn: listReunioes,
    refetchInterval: 60000,
  })
  const reunioesRef = useRef(reunioes)
  reunioesRef.current = reunioes

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  useEffect(() => {
    function checar() {
      const agora = Date.now()
      for (const r of reunioesRef.current) {
        const inicio = new Date(r.inicio).getTime()
        const minutos = (inicio - agora) / 60000

        if (minutos <= 30 && minutos > 1 && !jaDisparou(`${r.id}_soon`)) {
          marcarDisparado(`${r.id}_soon`)
          dispararAlerta(r, `em ${Math.round(minutos)} min`)
          break
        }
        if (minutos <= 1 && minutos > -3 && !jaDisparou(`${r.id}_now`)) {
          marcarDisparado(`${r.id}_now`)
          dispararAlerta(r, 'agora')
          break
        }
      }
    }

    function dispararAlerta(r, quando) {
      playSound('alarm')
      setAlerta({ reuniao: r, quando })
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`Reunião ${quando}: ${r.titulo}`, { body: formatHora(r.inicio) })
        } catch { /* ignore */ }
      }
    }

    checar()
    const t = setInterval(checar, 30000)
    return () => clearInterval(t)
  }, [])

  if (!alerta) return null

  const { reuniao, quando } = alerta

  return (
    <div
      className="fixed top-4 right-4 z-[90] w-80 rounded-2xl border border-accent/40 bg-surface shadow-2xl shadow-black/60 overflow-hidden"
      role="alertdialog"
      aria-label={`Reunião ${quando}`}
    >
      {reuniao.link ? (
        <a
          href={reuniao.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setAlerta(null)}
          className="block px-4 pt-4 pb-3 hover:bg-white/5 transition-colors"
        >
          <AlarmeConteudo reuniao={reuniao} quando={quando} />
        </a>
      ) : (
        <div className="px-4 pt-4 pb-3">
          <AlarmeConteudo reuniao={reuniao} quando={quando} />
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-2">
        <button
          type="button"
          onClick={() => setAlerta(null)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted hover:bg-white/5 transition-colors"
        >
          <X className="h-3.5 w-3.5" /> Dispensar
        </button>
        {reuniao.link && (
          <a
            href={reuniao.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setAlerta(null)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:opacity-90 transition-colors"
          >
            <Video className="h-3.5 w-3.5" /> Entrar
          </a>
        )}
      </div>
    </div>
  )
}

function AlarmeConteudo({ reuniao, quando }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
        <Bell className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-subtle">Reunião {quando}</p>
        <p className="mt-0.5 text-sm font-semibold text-foreground leading-snug">{reuniao.titulo}</p>
        <p className="mt-0.5 text-xs text-muted">{formatHora(reuniao.inicio)}</p>
        {reuniao.client?.nome && (
          <p className="text-xs text-subtle">{reuniao.client.nome}</p>
        )}
      </div>
    </div>
  )
}
