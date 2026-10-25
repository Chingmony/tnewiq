import { ArrowUpRight } from 'lucide-react'
import { useI18n } from '../i18n'
import { filterArticles } from '../lib/filter'
import { TONE_CLASSES, TOPIC_META } from '../lib/topics'
import { TOPICS, type Article, type Topic } from '../shared/article'
import { SectionTitle } from './HomeView'

const TILE_ACCENT = { orange: 'bg-orange', sun: 'bg-sun', sky: 'bg-sky' } as const

export function TopicsView({ articles, onOpenTopic }: { articles: Article[]; onOpenTopic: (t: Topic) => void }) {
  const { t } = useI18n()
  return (
    <section aria-labelledby="topics-title" className="flex flex-col gap-6">
      <SectionTitle id="topics-title">{t('topics.title')}</SectionTitle>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TOPICS.map((tp) => {
          const { icon: Icon, tone } = TOPIC_META[tp]
          const inTopic = filterArticles(articles, { query: '', topic: tp, sort: 'newest' })
          const latest = inTopic[0]
          return (
            <li key={tp}>
              <button
                type="button"
                onClick={() => onOpenTopic(tp)}
                className="group relative flex h-full w-full flex-col gap-4 overflow-hidden rounded-3xl border border-line bg-surface p-5 text-left shadow-card transition-transform hover:-translate-y-0.5"
              >
                <span aria-hidden className={`absolute -right-8 -top-8 size-24 rounded-full opacity-25 transition-transform group-hover:scale-125 ${TILE_ACCENT[tone]}`} />
                <span className="flex items-center justify-between">
                  <span className={`inline-flex size-12 items-center justify-center rounded-2xl ${TONE_CLASSES[tone]}`}>
                    <Icon aria-hidden className="size-6" />
                  </span>
                  <ArrowUpRight aria-hidden className="size-5 text-muted transition-colors group-hover:text-orange-ink" />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="font-display text-lg font-bold leading-tight">{t(`topic.${tp}`)}</span>
                  <span className="text-sm font-semibold text-muted">{t('topics.count', { count: inTopic.length })}</span>
                </span>
                {latest ? (
                  <span className="mt-auto border-t border-line pt-3 text-sm">
                    <span className="block text-xs font-bold uppercase tracking-wider text-orange-ink">{t('topics.latestStory')}</span>
                    <span lang={latest.originalLanguage ?? undefined} className="line-clamp-2">
                      {latest.originalTitle}
                    </span>
                  </span>
                ) : (
                  <span className="mt-auto text-sm text-muted">{t('topics.empty')}</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
