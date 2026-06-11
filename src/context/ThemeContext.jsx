import { createContext, useContext, useEffect, useState } from 'react'

export const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true) // SEMPRE dark mode (light mode oculto por enquanto)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    const root = document.getElementById('root')

    if (isDark) {
      // Dark mode: Cinza puro (sem azul)
      document.documentElement.style.backgroundColor = '#111111'
      document.body.style.backgroundColor = '#111111'
      document.body.style.color = '#f1f5f9'
      if (root) {
        root.style.backgroundColor = '#111111'
        root.style.color = '#f1f5f9'
      }
      // Adicionar CSS vars para contraste dinâmico
      document.documentElement.style.setProperty('--bg-primary', '#111111')
      document.documentElement.style.setProperty('--text-primary', '#ffffff')
    } else {
      // Light mode: Branco/cinza claro
      document.documentElement.style.backgroundColor = '#ffffff'
      document.body.style.backgroundColor = '#ffffff'
      document.body.style.color = '#1a1a1a'
      if (root) {
        root.style.backgroundColor = '#ffffff'
        root.style.color = '#1a1a1a'
      }
      // Adicionar CSS vars para contraste dinâmico
      document.documentElement.style.setProperty('--bg-primary', '#ffffff')
      document.documentElement.style.setProperty('--text-primary', '#1a1a1a')
    }

    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
  }, [isDark])

  function toggleTheme() {
    // Dark mode oculto por enquanto - toggle desabilitado
    // setIsDark((prev) => !prev)
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  }
  return context
}
