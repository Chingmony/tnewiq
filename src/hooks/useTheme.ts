import { useCallback, useEffect, useState } from 'react'
import { readJson, writeJson } from '../lib/storage'

export const THEMES = ['system', 'light', 'dark'] as const
export type ThemeChoice = (typeof THEMES)[number]

const KEY = 'theme'

function initial(): ThemeChoice {
  const stored = readJson<unknown>(KEY, 'system')
  return (THEMES as readonly unknown[]).includes(stored) ? (stored as ThemeChoice) : 'system'
}

/** "system" leaves data-theme unset so the CSS follows prefers-color-scheme. */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeChoice>(initial)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') delete root.dataset.theme
    else root.dataset.theme = theme
  }, [theme])

  const setTheme = useCallback((next: ThemeChoice) => {
    setThemeState(next)
    writeJson(KEY, next)
  }, [])

  return { theme, setTheme }
}
