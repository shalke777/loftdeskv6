import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'loftdesk-theme'
const DEFAULT_THEME = 'craft'

function applyTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme)
}

export function useTheme() {
  const [theme, setThemeState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME
    } catch {
      return DEFAULT_THEME
    }
  })

  // Inicjalizacja przy pierwszym renderze
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = useCallback((next: string) => {
    setThemeState(next)
    applyTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch { /* ignoruj błędy storage */ }
  }, [])

  return { theme, setTheme }
}

/**
 * ThemeInitializer — wstaw jako pierwszy element w <App /> lub <AppProviders />,
 * żeby motyw był stosowany przed pierwszym render (unika mignięcia).
 */
export function initThemeFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME
    document.documentElement.setAttribute('data-theme', saved)
  } catch { /* ignoruj */ }
}
