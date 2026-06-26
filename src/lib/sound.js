// Efeitos sonoros curtos via Web Audio (sem arquivos).
let ctx

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

function tone(freq, start, dur, type = 'sine', gain = 0.06) {
  const c = ensureCtx()
  if (!c) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  osc.connect(g)
  g.connect(c.destination)
  const t0 = c.currentTime + start
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

export function playSound(kind) {
  try {
    if (kind === 'new') {
      // toque ascendente — nova demanda
      tone(660, 0, 0.14)
      tone(880, 0.12, 0.18)
    } else if (kind === 'done') {
      // chime — demanda concluída
      tone(784, 0, 0.12)
      tone(988, 0.1, 0.12)
      tone(1319, 0.22, 0.22)
    } else if (kind === 'alarm') {
      // alarme — reunião
      for (let i = 0; i < 4; i++) tone(880, i * 0.32, 0.22, 'square', 0.08)
    }
  } catch {
    /* silencioso se o áudio não puder tocar */
  }
}
