import { ArrowRight, Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ArticleCard } from '../components/ArticleCard'
import { BriefingHero } from '../components/BriefingHero'
import { Feed } from '../components/Feed'
import { TopicChips } from '../components/TopicChips'
import { useI18n } from '../i18n'
import { briefingStats, filterArticles, pickFeatured } from '../lib/filter'
import { TONE_CLASSES, TOPIC_META } from '../lib/topics'
import { TOPICS, type Article, type Topic } from '../shared/article'

interface Props {
  articles: Article[]
  now: Date
  isBookmarked: (id: string) => boolean
  onToggleBookmark: (a: Article) => void
  onOpenTopic: (t: Topic) => void
  onNavigate: (v: 'latest' | 'settings') => void
}

export function HomeView({ articles, now, isBookmarked, onToggleBookmark, onOpenTopic, onNavigate }: Props) {
  const { t } = useI18n()
  const [topic, setTopic] = useState<Topic | null>(null)
  const stats = briefingStats(articles, now)
  const featured = pickFeatured(articles)
  const latest = useMemo(
    () => filterArticles(articles, { query: '', topic, sort: 'newest' }).filter((a) => a.id !== featured?.id),
    [articles, topic, featured],
  )
  const sourceCount = new Set(articles.map((a) => a.sourceId)).size

  return (
    <div className="flex flex-col gap-10">
      <BriefingHero now={now} newCount={stats.count} sourceCount={stats.sources} total={articles.length} />

      {featured && (
        <section aria-labelledby="featured-title" className="flex flex-col gap-4">
          <SectionTitle id="featured-title">{t('featured.title')}</SectionTitle>
          <ArticleCard article={featured} variant="featured" bookmarked={isBookmarked(featured.id)} onToggleBookmark={onToggleBookmark} />
        </section>
      )}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section aria-labelledby="latest-title" className="flex min-w-0 flex-col gap-5">
          <div className="flex items-end justify-between gap-4">
            <SectionTitle id="latest-title">{t('latest.title')}</SectionTitle>
            <a
              href="#latest"
              onClick={() => onNavigate('latest')}
              className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-orange-ink hover:underline"
            >
              {t('home.seeAll')} <ArrowRight aria-hidden className="size-4" />
            </a>
          </div>
          <TopicChips value={topic} onChange={setTopic} />
          <Feed
            key={topic ?? 'all'}
            articles={latest}
            pageSize={12}
            isBookmarked={isBookmarked}
            onToggleBookmark={onToggleBookmark}
            empty={topic ? t('topics.empty') : t('empty.feed')}
          />
        </section>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-36 lg:self-start">
          <div className="rounded-3xl border border-line bg-surface p-5">
            <h2 className="mb-3 font-display text-lg font-bold">{t('home.browseTopics')}</h2>
            <ul className="flex flex-col gap-1">
              {TOPICS.map((tp) => {
                const { icon: Icon, tone } = TOPIC_META[tp]
                const count = articles.filter((a) => a.topics.includes(tp)).length
                return (
                  <li key={tp}>
                    <button
                      type="button"
                      onClick={() => onOpenTopic(tp)}
                      className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-left text-sm font-semibold transition-colors hover:bg-surface-2"
                    >
                      <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${TONE_CLASSES[tone]}`}>
                        <Icon aria-hidden className="size-4" />
                      </span>
                      <span className="flex-1">{t(`topic.${tp}`)}</span>
                      <span className="tabular-nums text-muted">{count}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="rounded-3xl bg-ink p-5 text-bg">
            <span className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-orange text-on-accent">
              <Download aria-hidden className="size-5" />
            </span>
            <h2 className="font-display text-lg font-bold">{t('settings.install.title')}</h2>
            <p className="mt-1 text-sm opacity-80">{t('settings.install.subtitle')}</p>
            <a href="#settings" onClick={() => onNavigate('settings')} className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-sun hover:underline">
              {t('nav.settings')} <ArrowRight aria-hidden className="size-4" />
            </a>
          </div>

          <p className="px-1 text-xs text-muted">
            {t('briefing.sourceCount', { count: sourceCount })} · {t('settings.about')}
          </p>
        </aside>
      </div>
    </div>
  )
}

export function SectionTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="flex items-center gap-3 font-display text-2xl font-bold tracking-tight sm:text-[1.75rem]">
      <span aria-hidden className="h-6 w-1.5 rounded-full bg-orange" />
      {children}
    </h2>
  )
}
