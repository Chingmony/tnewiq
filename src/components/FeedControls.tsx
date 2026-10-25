import { Search, X } from 'lucide-react'
import { useI18n } from '../i18n'
import type { SortOrder } from '../lib/filter'
import type { Topic } from '../shared/article'
import { TopicChips } from './TopicChips'

interface Props {
  query: string
  onQuery: (q: string) => void
  topic: Topic | null
  onTopic: (t: Topic | null) => void
  sort: SortOrder
  onSort: (s: SortOrder) => void
  count: number
  autoFocus?: boolean
}

export function FeedControls({ query, onQuery, topic, onTopic, sort, onSort, count, autoFocus }: Props) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <label htmlFor="search" className="sr-only">
          {t('search.label')}
        </label>
        <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
        <input
          id="search"
          type="search"
          value={query}
          autoFocus={autoFocus}
          placeholder={t('search.placeholder')}
          onChange={(e) => onQuery(e.target.value)}
          className="h-14 w-full rounded-2xl border-2 border-line bg-surface pl-12 pr-12 text-base text-ink shadow-card outline-none transition-colors placeholder:text-muted focus:border-orange [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQuery('')}
            aria-label={t('search.clear')}
            className="absolute right-2 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
          >
            <X aria-hidden className="size-5" />
          </button>
        )}
      </div>

      <TopicChips value={topic} onChange={onTopic} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm font-semibold text-muted">
          {t('search.results', { count })}
        </p>
        <div role="group" aria-label={t('sort.label')} className="inline-flex rounded-full border border-line bg-surface p-1">
          {(['newest', 'oldest'] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={sort === s}
              onClick={() => onSort(s)}
              className={`min-h-9 rounded-full px-4 text-sm font-semibold transition-colors ${sort === s ? 'bg-sky text-on-accent' : 'text-muted hover:text-ink'}`}
            >
              {t(`sort.${s}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
