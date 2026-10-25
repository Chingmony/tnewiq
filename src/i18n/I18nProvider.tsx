import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { readJson, writeJson } from '../lib/storage'
import { I18nContext, type I18nValue } from './context'
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, isLocale, translate, type Locale } from './core'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = readJson<unknown>(LOCALE_STORAGE_KEY, null)
    return isLocale(stored) ? stored : DEFAULT_LOCALE
  })

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    writeJson(LOCALE_STORAGE_KEY, next)
  }, [])

  const value = useMemo<I18nValue>(
    () => ({ locale, setLocale, t: (key, vars) => translate(locale, key, vars) }),
    [locale, setLocale],
  )
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
