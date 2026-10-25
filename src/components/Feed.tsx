import { Inbox } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useI18n } from '../i18n'
import type { Article } from '../shared/article'
import { ArticleCard, ArticleCardSkeleton } from './ArticleCard'

interface FeedProps {
  articles: readonly Article[]
  isBookmarked: (id: string) => boolean
  onToggleBookmark: (article: Article) => void
  empty: ReactNode
  pageSize?: number
}

/** Responsive card grid with incremental "show more" paging. */
export function Feed({ articles, isBookmarked, onToggleBookmark, empty, pageSize = 24 }: FeedProps) {
  const { t } = useI18n()
  const [limit, setLimit] = useState(pageSize)

  if (articles.length === 0) return <EmptyState>{empty}</EmptyState>
  return (
    <div className="flex flex-col items-center gap-8">
      <ol className="grid w-full gap-4 sm:grid-cols-2 lg:gap-5">
        {articles.slice(0, limit).map((a) => (
          <li key={a.id} className="min-w-0">
            <ArticleCard article={a} bookmarked={isBookmarked(a.id)} onToggleBookmark={onToggleBookmark} />
          </li>
        ))}
      </ol>
      {articles.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((n) => n + pageSize)}
          className="min-h-11 rounded-full border-2 border-ink px-6 font-bold text-ink transition-colors hover:bg-ink hover:text-bg"
        >
          {t('feed.showMore')}
        </button>
      )}
    </div>
  )
}

export function FeedSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:gap-5">
      {Array.from({ length: 4 }, (_, i) => (
        <ArticleCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-line px-6 py-12 text-center text-muted">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-sun-soft text-orange-ink">
        <Inbox aria-hidden className="size-7" />
      </span>
      <p className="max-w-sm">{children}</p>
    </div>
  )
}
