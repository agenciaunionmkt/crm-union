import logoDark from '../assets/union-logo-dark.svg'
import logoLight from '../assets/union-logo-light.svg'

const HEIGHTS = {
  sm: 'h-7',
  md: 'h-10',
  lg: 'h-16',
}

/**
 * Logo oficial da Union Marketing (arquivos enviados pelo Junior).
 * - variant "dark": versão preta com "O" em amarelo, para fundos claros
 * - variant "light": versão branca com "O" em amarelo, para fundos escuros
 */
export default function UnionLogo({ variant = 'dark', size = 'md', className = '' }) {
  const src = variant === 'light' ? logoLight : logoDark
  const heightClass = HEIGHTS[size] ?? HEIGHTS.md

  return (
    <img
      src={src}
      alt="Union Marketing"
      className={`${heightClass} w-auto ${className}`}
    />
  )
}
