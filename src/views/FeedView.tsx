import { Feed } from '../components/Feed'
import { FeedControls } from '../components/FeedControls'
import { useI18n } from '../i18n'
import type { SortOrder } from '../lib/filter'
import type { Article, Topic } from '../shared/article'
import { SectionTitle } from './HomeView'

interface Props {
  mode: 'latest' | 'explore'
  filtered: Article[]
  query: string
  onQuery: (q: string) => void
  topic: Topic | null
  onTopic: (t: Topic | null) => void
  sort: SortOrder
  onSort: (s: SortOrder) => void
  isBookmarked: (id: string) => boolean
  onToggleBookmark: (a: Article) => void
}

/** Shared by Latest and Explore; Explore puts the search field in focus. */
export function FeedView({ mode, filtered, isBookmarked, onToggleBookmark, ...controls }: Props) {
  const { t } = useI18n()
  const filteredByUser = controls.query !== '' || controls.topic !== null
  return (
    <section aria-labelledby="feed-title" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <SectionTitle id="feed-title">{mode === 'explore' ? t('explore.title') : t('latest.title')}</SectionTitle>
        {mode === 'explore' && <p className="text-muted">{t('explore.hint')}</p>}
      </div>
      <FeedControls {...controls} count={filtered.length} autoFocus={mode === 'explore'} />
      <Feed
        key={`${controls.query}|${controls.topic}|${controls.sort}`}
        articles={filtered}
        isBookmarked={isBookmarked}
        onToggleBookmark={onToggleBookmark}
        empty={filteredByUser ? t('empty.search') : t('empty.feed')}
      />
    </section>
  )
}
