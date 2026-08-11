// Converte um valor em reais para extenso (pt-BR). Cobre até 999.999.999,99.
// Serve como sugestão editável no contrato — o usuário pode ajustar antes de enviar.

const UNIDADES = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove']
const DEZ_A_DEZENOVE = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
const CENTENAS = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']

// Extenso de um grupo de 0-999.
function grupo(n) {
  if (n === 0) return ''
  if (n === 100) return 'cem'
  const partes = []
  const c = Math.floor(n / 100)
  const resto = n % 100
  if (c) partes.push(CENTENAS[c])
  if (resto) {
    if (resto < 10) partes.push(UNIDADES[resto])
    else if (resto < 20) partes.push(DEZ_A_DEZENOVE[resto - 10])
    else {
      const d = Math.floor(resto / 10)
      const u = resto % 10
      partes.push(u ? `${DEZENAS[d]} e ${UNIDADES[u]}` : DEZENAS[d])
    }
  }
  return partes.join(' e ')
}

export function numeroPorExtenso(n) {
  return inteiroPorExtenso(Math.round(Number(n) || 0))
}

function inteiroPorExtenso(n) {
  if (n === 0) return 'zero'
  const milhoes = Math.floor(n / 1_000_000)
  const milhares = Math.floor((n % 1_000_000) / 1000)
  const resto = n % 1000
  const partes = []
  if (milhoes) partes.push(milhoes === 1 ? 'um milhão' : `${grupo(milhoes)} milhões`)
  if (milhares) partes.push(milhares === 1 ? 'mil' : `${grupo(milhares)} mil`)
  if (resto) partes.push(grupo(resto))
  return partes.join(', ')
}

export function reaisPorExtenso(valor) {
  const v = Math.round(Number(valor) * 100) / 100
  const reais = Math.floor(v)
  const centavos = Math.round((v - reais) * 100)
  const partes = []
  if (reais > 0) partes.push(`${inteiroPorExtenso(reais)} ${reais === 1 ? 'real' : 'reais'}`)
  if (centavos > 0) partes.push(`${inteiroPorExtenso(centavos)} ${centavos === 1 ? 'centavo' : 'centavos'}`)
  if (partes.length === 0) return 'zero real'
  return partes.join(' e ')
}
