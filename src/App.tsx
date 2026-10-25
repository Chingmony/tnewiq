// Functional shell only. Layout and styling wait for the approved design direction.
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArticleItem } from './components/ArticleItem'
import { useBookmarks } from './hooks/useBookmarks'
import { useFeed, useOnline } from './hooks/useFeed'
import { useInstallPrompt } from './hooks/useInstallPrompt'
import { ENDONYMS, LOCALES, isLocale, useI18n, type MessageKey } from './i18n'
import { loadSources } from './lib/data'
import { briefingStats, filterArticles, pickFeatured, type SortOrder } from './lib/filter'
import { formatDateTime, formatRelative } from './lib/format'
import { TOPICS, type Article, type PublicSource, type Topic } from './shared/article'

const VIEWS = ['home', 'latest', 'topics', 'explore', 'bookmarks', 'settings'] as const
type View = (typeof VIEWS)[number]

const viewFromHash = (): View => {
  const hash = window.location.hash.slice(1)
  return (VIEWS as readonly string[]).includes(hash) ? (hash as View) : 'home'
}

interface AppProps {
  fetchImpl?: typeof fetch
}

export default function App({ fetchImpl }: AppProps) {
  const { t, locale, setLocale } = useI18n()
  const { state, reload } = useFeed(fetchImpl)
  const online = useOnline()
  const bookmarks = useBookmarks()
  const [view, setView] = useState<View>(viewFromHash)
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState<Topic | null>(null)
  const [sort, setSort] = useState<SortOrder>('newest')
  const [now] = useState(() => new Date())

  useEffect(() => {
    const onHash = () => setView(viewFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const articles = useMemo(() => (state.status === 'ready' ? state.data.articles : []), [state])
  const filtered = useMemo(() => filterArticles(articles, { query, topic, sort }), [articles, query, topic, sort])

  const go = (next: View) => {
    window.location.hash = next
    setView(next)
  }

  const renderList = (list: readonly Article[], empty: MessageKey) =>
    list.length === 0 ? (
      <p>{t(empty)}</p>
    ) : (
      <ol className="feed">
        {list.map((a) => (
          <li key={a.id}>
            <ArticleItem article={a} bookmarked={bookmarks.isBookmarked(a.id)} onToggleBookmark={bookmarks.toggle} />
          </li>
        ))}
      </ol>
    )

  const controls = (
    <div className="controls">
      <label>
        {t('search.label')}{' '}
        <input type="search" id="search" value={query} placeholder={t('search.placeholder')} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <label>
        {t('topic.filterLabel')}{' '}
        <select id="topic" value={topic ?? ''} onChange={(e) => setTopic((e.target.value || null) as Topic | null)}>
          <option value="">{t('topic.all')}</option>
          {TOPICS.map((tp) => (
            <option key={tp} value={tp}>
              {t(`topic.${tp}`)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t('sort.label')}{' '}
        <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as SortOrder)}>
          <option value="newest">{t('sort.newest')}</option>
          <option value="oldest">{t('sort.oldest')}</option>
        </select>
      </label>
      <p role="status">{t('search.results', { count: filtered.length })}</p>
    </div>
  )

  let content: ReactNode
  if (view === 'settings') {
    content = <Settings onClearBookmarks={bookmarks.clear} fetchImpl={fetchImpl} />
  } else if (view === 'bookmarks') {
    content = (
      <section>
        <h2>{t('bookmarks.title')}</h2>
        <p>{t('bookmarks.note')}</p>
        {renderList(bookmarks.bookmarks, 'empty.bookmarks')}
      </section>
    )
  } else if (state.status === 'loading') {
    content = <p role="status">{t('status.loading')}</p>
  } else if (state.status === 'error') {
    content = (
      <div role="alert">
        <p>{t('status.error')}</p>
        <button type="button" onClick={() => void reload()}>
          {t('status.retry')}
        </button>
      </div>
    )
  } else if (view === 'topics') {
    content = (
      <section>
        <h2>{t('topics.title')}</h2>
        <ul>
          {TOPICS.map((tp) => (
            <li key={tp}>
              <button
                type="button"
                onClick={() => {
                  setTopic(tp)
                  go('latest')
                }}
              >
                {t(`topic.${tp}`)} ({t('topics.count', { count: articles.filter((a) => a.topics.includes(tp)).length })})
              </button>
            </li>
          ))}
        </ul>
      </section>
    )
  } else if (view === 'home') {
    const stats = briefingStats(articles, now)
    const featured = pickFeatured(articles)
    content = (
      <>
        <section>
          <h2>{t('briefing.title')}</h2>
          <p>{stats.count > 0 ? t('briefing.summary', { count: stats.count, sources: stats.sources }) : t('briefing.none')}</p>
        </section>
        {featured && (
          <section>
            <h2>{t('featured.title')}</h2>
            <ArticleItem article={featured} bookmarked={bookmarks.isBookmarked(featured.id)} onToggleBookmark={bookmarks.toggle} />
          </section>
        )}
        <section>
          <h2>{t('latest.title')}</h2>
          {controls}
          {renderList(filtered.slice(0, 20), query || topic ? 'empty.search' : 'empty.feed')}
        </section>
      </>
    )
  } else {
    content = (
      <section>
        <h2>{view === 'explore' ? t('explore.title') : t('latest.title')}</h2>
        {view === 'explore' && <p>{t('explore.hint')}</p>}
        {controls}
        {renderList(filtered, query || topic ? 'empty.search' : 'empty.feed')}
      </section>
    )
  }

  return (
    <>
      <a className="sr-only" href="#main">
        {t('nav.skip')}
      </a>
      <header>
        <h1>{t('app.name')}</h1>
        <p>{t('app.tagline')}</p>
        <p className="notice">{t('app.designPending')}</p>
        <label>
          {t('settings.language')}{' '}
          <select id="locale-header" value={locale} onChange={(e) => isLocale(e.target.value) && setLocale(e.target.value)}>
            {LOCALES.map((l) => (
              <option key={l} value={l} lang={l}>
                {ENDONYMS[l]}
              </option>
            ))}
          </select>
        </label>
        {state.status === 'ready' && (
          <p>
            {t('status.updated', { time: formatRelative(state.data.generatedAt, locale) })}
            {state.downloadedAt && <> · {t('status.downloaded', { time: formatDateTime(state.downloadedAt, locale) })}</>}
          </p>
        )}
        {!online && <p role="status">{t('status.offline')}</p>}
      </header>
      <nav aria-label={t('nav.label')}>
        <ul>
          {VIEWS.map((v) => (
            <li key={v}>
              <a href={`#${v}`} aria-current={view === v ? 'page' : undefined} onClick={() => setView(v)}>
                {t(`nav.${v}`)}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <main id="main">{content}</main>
    </>
  )
}

function Settings({ onClearBookmarks, fetchImpl }: { onClearBookmarks: () => void; fetchImpl?: typeof fetch }) {
  const { t, locale, setLocale } = useI18n()
  const { canInstall, installed, install } = useInstallPrompt()
  const [cleared, setCleared] = useState(false)
  const [sources, setSources] = useState<PublicSource[]>([])

  useEffect(() => {
    loadSources(fetchImpl).then(setSources, () => setSources([]))
  }, [fetchImpl])

  return (
    <section>
      <h2>{t('settings.title')}</h2>
      <fieldset>
        <legend>{t('settings.language')}</legend>
        {LOCALES.map((l) => (
          <label key={l} lang={l}>
            <input type="radio" name="locale" id={`locale-${l}`} checked={locale === l} onChange={() => setLocale(l)} /> {ENDONYMS[l]}
          </label>
        ))}
      </fieldset>
      <h3>{t('settings.install.title')}</h3>
      {installed ? (
        <p>{t('settings.install.installed')}</p>
      ) : (
        <>
          {canInstall && (
            <button type="button" onClick={() => void install()}>
              {t('settings.install.button')}
            </button>
          )}
          <ul>
            <li>{t('settings.install.android')}</li>
            <li>{t('settings.install.ios')}</li>
            <li>{t('settings.install.desktop')}</li>
          </ul>
        </>
      )}
      <h3>{t('settings.data.title')}</h3>
      <button
        type="button"
        onClick={() => {
          onClearBookmarks()
          setCleared(true)
        }}
      >
        {t('settings.data.clearBookmarks')}
      </button>
      {cleared && <p role="status">{t('settings.data.cleared')}</p>}
      <h3>{t('settings.sources')}</h3>
      <p>{t('settings.about')}</p>
      <ul>
        {sources.map((s) => (
          <li key={s.id}>
            <a href={s.homepage} target="_blank" rel="noopener noreferrer" lang={s.language}>
              {s.name}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
