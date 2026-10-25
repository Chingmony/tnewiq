import { Clock3, Languages, Search, WifiOff } from 'lucide-react'
import { ENDONYMS, LOCALES, isLocale, useI18n } from '../i18n'
import { formatDateTime, formatRelative } from '../lib/format'
import { LogoMark, Wordmark } from './Logo'

/** Fixed-height (4rem) bar, so the desktop tab row can stick directly beneath it. */
export function Header({ onSearch }: { onSearch: () => void }) {
  const { t, locale, setLocale } = useI18n()
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-2 sm:gap-3">
        <a href="#home" className="flex items-center gap-2.5 rounded-xl" aria-label={t('app.name')}>
          <LogoMark />
          <Wordmark />
        </a>

        <button
          type="button"
          onClick={onSearch}
          className="ml-auto hidden h-11 w-72 items-center gap-3 rounded-full border border-line bg-surface px-4 text-sm text-muted shadow-card transition-colors hover:border-orange md:flex"
        >
          <Search aria-hidden className="size-4" />
          {t('search.placeholder')}
        </button>
        <button
          type="button"
          onClick={onSearch}
          aria-label={t('nav.search')}
          className="ml-auto inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-surface-2 md:hidden"
        >
          <Search aria-hidden className="size-5" />
        </button>

        <label className="relative inline-flex h-11 items-center rounded-full border border-line bg-surface pl-3 pr-2 text-sm font-semibold text-ink transition-colors hover:border-orange">
          <Languages aria-hidden className="size-4 text-orange-ink" />
          <span className="sr-only">{t('settings.language')}</span>
          <select
            id="locale-header"
            value={locale}
            onChange={(e) => isLocale(e.target.value) && setLocale(e.target.value)}
            className="h-full max-w-[6.5rem] cursor-pointer appearance-none bg-transparent pl-2 pr-1 outline-none"
          >
            {LOCALES.map((l) => (
              <option key={l} value={l} lang={l}>
                {ENDONYMS[l]}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  )
}

interface StatusProps {
  updatedAt: string | null
  downloadedAt: string | null
  online: boolean
}

export function StatusLine({ updatedAt, downloadedAt, online }: StatusProps) {
  const { t, locale } = useI18n()
  if (!updatedAt && online) return null
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
      {updatedAt && (
        <span className="inline-flex items-center gap-1.5" title={downloadedAt ? t('status.downloaded', { time: formatDateTime(downloadedAt, locale) }) : undefined}>
          <Clock3 aria-hidden className="size-3.5 text-sky-ink" />
          {t('status.updated', { time: formatRelative(updatedAt, locale) })}
        </span>
      )}
      {!online && (
        <span role="status" className="inline-flex items-center gap-1.5 rounded-full bg-sun-soft px-2.5 py-1 font-semibold text-ink">
          <WifiOff aria-hidden className="size-3.5" />
          {t('status.offline')}
        </span>
      )}
    </div>
  )
}
