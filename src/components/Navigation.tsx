import { Bookmark, Compass, Home, LayoutGrid, Newspaper, Settings, type LucideIcon } from 'lucide-react'
import { useI18n } from '../i18n'
import { VIEWS, type View } from '../lib/views'

const ICONS: Record<View, LucideIcon> = {
  home: Home,
  latest: Newspaper,
  topics: LayoutGrid,
  explore: Compass,
  bookmarks: Bookmark,
  settings: Settings,
}

/**
 * One navigation landmark for every screen size:
 * a fixed bottom bar on phones (Explore lives behind the header search there),
 * a sticky tab row under the header on larger screens.
 */
export function Navigation({ view, onNavigate }: { view: View; onNavigate: (v: View) => void }) {
  const { t } = useI18n()
  return (
    <nav
      aria-label={t('nav.label')}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:sticky md:top-16 md:bottom-auto md:border-b md:border-t-0 md:bg-bg/90 md:pb-0"
    >
      <ul className="container-page flex justify-between md:justify-start md:gap-1">
        {VIEWS.map((v) => {
          const Icon = ICONS[v]
          const active = v === view
          return (
            <li key={v} className={v === 'explore' ? 'max-md:hidden' : 'flex-1 md:flex-none'}>
              <a
                href={`#${v}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => onNavigate(v)}
                className={`group flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors md:min-h-12 md:flex-row md:gap-2 md:px-4 md:text-sm ${
                  active ? 'text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                <span
                  className={`inline-flex h-7 w-12 items-center justify-center rounded-full transition-colors md:h-auto md:w-auto ${
                    active ? 'bg-orange text-on-accent md:bg-transparent md:text-orange-ink' : ''
                  }`}
                >
                  <Icon aria-hidden className="size-5 md:size-4" strokeWidth={active ? 2.5 : 2} />
                </span>
                <span className={active ? 'md:border-b-2 md:border-orange md:pb-0.5' : ''}>{t(`nav.${v}`)}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
