import { fieldBase, fieldBorder } from './Input'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const anoAtual = new Date().getFullYear()
const ANOS = [anoAtual, anoAtual + 1, anoAtual + 2]

// value: 'yyyy-MM-dd' ou '' | onChange: (isoDate) => void
export default function DateSelect({ label, value, onChange }) {
  const [y, m, d] = value ? value.split('-') : ['', '', '']

  function update(field, val) {
    const next = {
      y: field === 'y' ? val : (y || String(anoAtual)),
      m: field === 'm' ? val : (m || '01'),
      d: field === 'd' ? val : (d || '01'),
    }
    if (next.y && next.m && next.d) {
      onChange(`${next.y}-${next.m}-${next.d}`)
    } else {
      onChange('')
    }
  }

  const selectClass = `${fieldBase} ${fieldBorder(false)} [color-scheme:dark]`

  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-medium text-muted">{label}</label>}
      <div className="grid grid-cols-3 gap-2">
        <select
          value={d || ''}
          onChange={(e) => update('d', e.target.value)}
          className={selectClass}
          aria-label="Dia"
        >
          <option value="">Dia</option>
          {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((v) => (
            <option key={v} value={v}>{Number(v)}</option>
          ))}
        </select>

        <select
          value={m || ''}
          onChange={(e) => update('m', e.target.value)}
          className={selectClass}
          aria-label="Mês"
        >
          <option value="">Mês</option>
          {MESES.map((nome, i) => {
            const val = String(i + 1).padStart(2, '0')
            return <option key={val} value={val}>{nome}</option>
          })}
        </select>

        <select
          value={y || ''}
          onChange={(e) => update('y', e.target.value)}
          className={selectClass}
          aria-label="Ano"
        >
          <option value="">Ano</option>
          {ANOS.map((a) => <option key={a} value={String(a)}>{a}</option>)}
        </select>
      </div>
    </div>
  )
}
