import { useEffect, useRef } from 'react'

const SELECTOR =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

// Acessibilidade de modal: ESC fecha, Tab fica preso dentro, foco inicial e
// retorno do foco ao elemento anterior quando fecha.
export function useModalA11y(open, containerRef, onClose) {
  // Mantém o onClose atual em um ref para o efeito não depender da sua identidade
  // (senão re-executa a cada render e rouba o foco do campo sendo digitado).
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const prevFocused = document.activeElement
    const node = containerRef.current
    const focusables = () => (node ? Array.from(node.querySelectorAll(SELECTOR)) : [])

    const t = setTimeout(() => {
      const list = focusables()
      ;(list[0] || node)?.focus?.()
    }, 0)

    function onKey(e) {
      if (e.key === 'Escape') {
        onCloseRef.current?.()
        return
      }
      if (e.key !== 'Tab') return
      const list = focusables()
      if (list.length === 0) return
      const first = list[0]
      const last = list[list.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      prevFocused?.focus?.()
    }
  }, [open, containerRef])
}
