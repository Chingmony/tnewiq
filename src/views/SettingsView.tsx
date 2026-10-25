import { Check, Download, ExternalLink, Laptop, Monitor, Moon, Smartphone, Sun, Tablet, Trash2 } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { THEMES, type ThemeChoice } from '../hooks/useTheme'
import { ENDONYMS, LOCALES, useI18n } from '../i18n'
import { loadSources } from '../lib/data'
import type { PublicSource } from '../shared/article'
import { SectionTitle } from './HomeView'

interface Props {
  theme: ThemeChoice
  onTheme: (t: ThemeChoice) => void
  onClearBookmarks: () => void
  fetchImpl?: typeof fetch
}

const THEME_ICONS = { system: Monitor, light: Sun, dark: Moon } as const

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5 sm:p-6">
      <h3 className="font-display text-lg font-bold">{title}</h3>
      {children}
    </section>
  )
}

const option = 'flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 font-semibold transition-colors'

export function SettingsView({ theme, onTheme, onClearBookmarks, fetchImpl }: Props) {
  const { t, locale, setLocale } = useI18n()
  const { canInstall, installed, install } = useInstallPrompt()
  const [cleared, setCleared] = useState(false)
  const [sources, setSources] = useState<PublicSource[]>([])

  useEffect(() => {
    loadSources(fetchImpl).then(setSources, () => setSources([]))
  }, [fetchImpl])

  return (
    <section aria-labelledby="settings-title" className="flex flex-col gap-6">
      <SectionTitle id="settings-title">{t('settings.title')}</SectionTitle>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title={t('settings.language')}>
          <fieldset className="grid grid-cols-2 gap-2">
            <legend className="sr-only">{t('settings.language')}</legend>
            {LOCALES.map((l) => (
              <label key={l} lang={l} className={`${option} ${locale === l ? 'border-orange bg-orange-soft' : 'border-line hover:border-orange'}`}>
                <input type="radio" name="locale" id={`locale-${l}`} className="sr-only" checked={locale === l} onChange={() => setLocale(l)} />
                <span className="flex-1">{ENDONYMS[l]}</span>
                {locale === l && <Check aria-hidden className="size-5 text-orange-ink" />}
              </label>
            ))}
          </fieldset>
        </Card>

        <Card title={t('settings.theme')}>
          <fieldset className="grid grid-cols-3 gap-2">
            <legend className="sr-only">{t('settings.theme')}</legend>
            {THEMES.map((th) => {
              const Icon = THEME_ICONS[th]
              return (
                <label key={th} className={`${option} flex-col justify-center gap-1 py-3 text-sm ${theme === th ? 'border-sky bg-sky-soft' : 'border-line hover:border-sky'}`}>
                  <input type="radio" name="theme" id={`theme-${th}`} className="sr-only" checked={theme === th} onChange={() => onTheme(th)} />
                  <Icon aria-hidden className="size-5" />
                  {t(`theme.${th}`)}
                </label>
              )
            })}
          </fieldset>
        </Card>

        <Card title={t('settings.install.title')}>
          {installed ? (
            <p className="flex items-center gap-2 font-semibold text-sky-ink">
              <Check aria-hidden className="size-5" /> {t('settings.install.installed')}
            </p>
          ) : (
            <>
              <p className="text-muted">{t('settings.install.subtitle')}</p>
              {canInstall && (
                <button
                  type="button"
                  onClick={() => void install()}
                  className="inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-orange px-5 font-bold text-on-accent hover:bg-sun"
                >
                  <Download aria-hidden className="size-5" /> {t('settings.install.button')}
                </button>
              )}
              <ul className="flex flex-col gap-3 text-sm">
                {[
                  [Smartphone, 'settings.install.android'],
                  [Tablet, 'settings.install.ios'],
                  [Laptop, 'settings.install.desktop'],
                ].map(([Icon, key]) => {
                  const I = Icon as typeof Smartphone
                  return (
                    <li key={key as string} className="flex gap-3">
                      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-sun-soft">
                        <I aria-hidden className="size-4" />
                      </span>
                      <span className="pt-1">{t(key as 'settings.install.android')}</span>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </Card>

        <Card title={t('settings.data.title')}>
          <p className="text-muted">{t('bookmarks.note')}</p>
          <button
            type="button"
            onClick={() => {
              onClearBookmarks()
              setCleared(true)
            }}
            className="inline-flex min-h-12 w-fit items-center gap-2 rounded-full border-2 border-line px-5 font-bold hover:border-orange-ink hover:text-orange-ink"
          >
            <Trash2 aria-hidden className="size-5" /> {t('settings.data.clearBookmarks')}
          </button>
          {cleared && (
            <p role="status" className="text-sm font-semibold text-sky-ink">
              {t('settings.data.cleared')}
            </p>
          )}
        </Card>
      </div>

      <Card title={t('settings.sources')}>
        <p className="text-muted">{t('settings.about')}</p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((s) => (
            <li key={s.id}>
              <a
                href={s.homepage}
                target="_blank"
                rel="noopener noreferrer"
                lang={s.language}
                className="flex min-h-11 items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 text-sm font-semibold hover:text-orange-ink"
              >
                <span className="truncate">{s.name}</span>
                <ExternalLink aria-hidden className="size-4 shrink-0 text-muted" />
                <span className="sr-only"> ({t('article.opensNewTab')})</span>
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  )
}
