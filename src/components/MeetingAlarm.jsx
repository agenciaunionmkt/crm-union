import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Video, X, Bell } from 'lucide-react'
import { listReunioes } from '../lib/api/reunioes'
import { playSound } from '../lib/sound'

// Marca um alarme como já disparado (persiste para não repetir ao recarregar).
function jaDisparou(key) {
  try {
    return localStorage.getItem(`alarm_${key}`) === '1'
  } catch {
    return false
  }
}
function marcarDisparado(key) {
  try {
    localStorage.setItem(`alarm_${key}`, '1')
  } catch {
    /* ignore */
  }
}

function formatHora(value) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
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

        // ~30 min antes (também cobre quem abriu o app já dentro da janela)
        if (minutos <= 30 && minutos > 1 && !jaDisparou(`${r.id}_soon`)) {
          marcarDisparado(`${r.id}_soon`)
          dispararAlerta(r, `em ${Math.round(minutos)} min`)
          break
        }
        // na hora
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
          new Notification(`Reunião ${quando}: ${r.titulo}`, {
            body: formatHora(r.inicio),
          })
        } catch {
          /* ignore */
        }
      }
    }

    checar()
    const t = setInterval(checar, 30000)
    return () => clearInterval(t)
  }, [])

  if (!alerta) return null

  const { reuniao, quando } = alerta
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl border border-accent/40 bg-surface p-6 shadow-2xl shadow-black/60">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Bell className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-subtle">Reunião {quando}</p>
            <h3 className="mt-0.5 font-display text-lg font-bold tracking-tight text-foreground">
              {reuniao.titulo}
            </h3>
            <p className="mt-1 text-sm text-muted">{formatHora(reuniao.inicio)}</p>
            {reuniao.client?.nome && (
              <p className="text-xs text-subtle">Cliente: {reuniao.client.nome}</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setAlerta(null)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted hover:bg-white/5 transition-colors"
          >
            <X className="h-4 w-4" /> Dispensar
          </button>
          {reuniao.link && (
            <a
              href={reuniao.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setAlerta(null)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 transition-colors"
            >
              <Video className="h-4 w-4" /> Entrar na reunião
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
