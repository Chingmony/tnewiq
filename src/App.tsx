import { RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { FeedSkeleton } from './components/Feed'
import { Header, StatusLine } from './components/Header'
import { Navigation } from './components/Navigation'
import { useBookmarks } from './hooks/useBookmarks'
import { useFeed, useOnline } from './hooks/useFeed'
import { useTheme } from './hooks/useTheme'
import { useI18n } from './i18n'
import { filterArticles, type SortOrder } from './lib/filter'
import { VIEWS, type View } from './lib/views'
import type { Topic } from './shared/article'
import { BookmarksView } from './views/BookmarksView'
import { FeedView } from './views/FeedView'
import { HomeView } from './views/HomeView'
import { SettingsView } from './views/SettingsView'
import { TopicsView } from './views/TopicsView'

const viewFromHash = (): View => {
  const hash = window.location.hash.slice(1)
  return (VIEWS as readonly string[]).includes(hash) ? (hash as View) : 'home'
}

interface AppProps {
  fetchImpl?: typeof fetch
}

export default function App({ fetchImpl }: AppProps) {
  const { t } = useI18n()
  const { state, reload } = useFeed(fetchImpl)
  const online = useOnline()
  const bookmarks = useBookmarks()
  const { theme, setTheme } = useTheme()
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
    if (window.location.hash !== `#${next}`) window.location.hash = next
    setView(next)
    window.scrollTo?.({ top: 0 })
  }
  const openTopic = (tp: Topic) => {
    setTopic(tp)
    setQuery('')
    go('latest')
  }

  let content: ReactNode
  if (view === 'settings') {
    content = <SettingsView theme={theme} onTheme={setTheme} onClearBookmarks={bookmarks.clear} fetchImpl={fetchImpl} />
  } else if (view === 'bookmarks') {
    content = <BookmarksView bookmarks={bookmarks.bookmarks} isBookmarked={bookmarks.isBookmarked} onToggleBookmark={bookmarks.toggle} />
  } else if (state.status === 'loading') {
    content = (
      <div className="flex flex-col gap-6">
        <p role="status" className="sr-only">
          {t('status.loading')}
        </p>
        <div aria-hidden className="h-64 animate-pulse rounded-[2rem] bg-surface-2" />
        <FeedSkeleton />
      </div>
    )
  } else if (state.status === 'error') {
    content = (
      <div role="alert" className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-line px-6 py-14 text-center">
        <p className="max-w-md text-lg">{t('status.error')}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-orange px-6 font-bold text-on-accent hover:bg-sun"
        >
          <RefreshCw aria-hidden className="size-5" /> {t('status.retry')}
        </button>
      </div>
    )
  } else if (view === 'topics') {
    content = <TopicsView articles={articles} onOpenTopic={openTopic} />
  } else if (view === 'home') {
    content = (
      <HomeView
        articles={articles}
        now={now}
        isBookmarked={bookmarks.isBookmarked}
        onToggleBookmark={bookmarks.toggle}
        onOpenTopic={openTopic}
        onNavigate={go}
      />
    )
  } else {
    content = (
      <FeedView
        mode={view}
        filtered={filtered}
        query={query}
        onQuery={setQuery}
        topic={topic}
        onTopic={setTopic}
        sort={sort}
        onSort={setSort}
        isBookmarked={bookmarks.isBookmarked}
        onToggleBookmark={bookmarks.toggle}
      />
    )
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-ink px-4 py-2 font-bold text-bg focus:fixed focus:left-4 focus:top-4"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main')?.focus()
        }}
      >
        {t('nav.skip')}
      </a>
      <Header onSearch={() => go('explore')} />
      <Navigation view={view} onNavigate={go} />
      <main id="main" tabIndex={-1} className="container-page flex flex-col gap-6 pb-28 pt-6 outline-none md:pb-16 md:pt-8">
        <StatusLine
          updatedAt={state.status === 'ready' ? state.data.generatedAt : null}
          downloadedAt={state.status === 'ready' ? state.downloadedAt : null}
          online={online}
        />
        {content}
      </main>
    </>
  )
}
