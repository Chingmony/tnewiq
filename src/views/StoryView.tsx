import { ArrowLeft, ArrowUpRight, Bookmark, BookmarkCheck, Languages, Lightbulb, ListChecks, Share2, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ArticleCard } from '../components/ArticleCard'
import { EmptyState } from '../components/Feed'
import { TopicBadge } from '../components/TopicBadge'
import { useInsight } from '../hooks/useInsight'
import { useI18n, type MessageKey } from '../i18n'
import { filterArticles } from '../lib/filter'
import { formatDateTime } from '../lib/format'
import { shouldOfferTranslation, translatePageUrl } from '../lib/translate'
import type { Article } from '../shared/article'

interface Props {
  article: Article | null
  articles: readonly Article[]
  isBookmarked: (id: string) => boolean
  onToggleBookmark: (a: Article) => void
  onBack: () => void
  fetchImpl?: typeof fetch
}

const KNOWN_LANGS = ['en', 'km', 'zh-CN', 'ko']
const secondary =
  'inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-line bg-surface px-4 text-sm font-bold text-ink transition-colors hover:border-orange'

export function StoryView({ article, articles, isBookmarked, onToggleBookmark, onBack, fetchImpl }: Props) {
  const { t, locale } = useI18n()
  const insightState = useInsight(article?.id ?? null, article?.contentHash ?? null, fetchImpl)
  const [shared, setShared] = useState(false)

  const related = useMemo(() => {
    if (!article) return []
    return filterArticles(articles, { query: '', topic: article.topics[0], sort: 'newest' })
      .filter((a) => a.id !== article.id)
      .slice(0, 4)
  }, [article, articles])

  const back = (
    <button type="button" onClick={onBack} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full pr-3 font-bold text-muted hover:text-ink">
      <ArrowLeft aria-hidden className="size-5" /> {t('story.back')}
    </button>
  )

  if (!article) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        {back}
        <EmptyState>{t('story.notFound')}</EmptyState>
      </div>
    )
  }

  const lang = article.originalLanguage
  const insight = insightState.status === 'ready' ? insightState.insight : null
  const localized = insight?.languages[locale] ?? null
  const translatedTitle = localized && lang !== locale ? localized.title : null
  const bookmarked = isBookmarked(article.id)
  const langName = t((lang && KNOWN_LANGS.includes(lang) ? `langName.${lang}` : 'langName.unknown') as MessageKey)

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: article!.originalTitle, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setShared(true)
      window.setTimeout(() => setShared(false), 2500)
    } catch {
      // The user dismissed the share sheet or clipboard access was refused; nothing to do.
    }
  }

  return (
    <article aria-labelledby="story-title" className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      {back}

      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {article.topics.map((topic) => (
            <TopicBadge key={topic} topic={topic} />
          ))}
        </div>
        <h1
          id="story-title"
          lang={translatedTitle ? locale : (lang ?? undefined)}
          className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-[2.75rem]"
        >
          {translatedTitle ?? article.originalTitle}
        </h1>
        {translatedTitle && (
          <p className="flex flex-col gap-1 border-l-4 border-cream pl-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">{t('story.originalTitle')}</span>
            <span lang={lang ?? undefined} className="text-lg font-semibold">
              {article.originalTitle}
            </span>
          </p>
        )}
        <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
          <span>
            {t('story.source')}: <span className="font-bold text-ink">{article.sourceName}</span>
          </span>
          {article.publishedAt ? (
            <time dateTime={article.publishedAt}>{t('article.published', { date: formatDateTime(article.publishedAt, locale) })}</time>
          ) : (
            <span>
              {t('article.dateUnknown')} · {t('article.firstSeen', { date: formatDateTime(article.discoveredAt, locale) })}
            </span>
          )}
          <span>{t('article.originalLanguage', { language: langName })}</span>
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <a
            href={article.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-orange px-6 font-bold text-on-accent transition-colors hover:bg-sun"
          >
            {t('article.readOriginal')} <ArrowUpRight aria-hidden className="size-5" strokeWidth={2.5} />
            <span className="sr-only"> ({t('article.opensNewTab')})</span>
          </a>
          <button type="button" aria-pressed={bookmarked} onClick={() => onToggleBookmark(article)} className={`${secondary} ${bookmarked ? 'border-orange text-orange-ink' : ''}`}>
            {bookmarked ? <BookmarkCheck aria-hidden className="size-5" fill="currentColor" strokeWidth={1.5} /> : <Bookmark aria-hidden className="size-5" />}
            {bookmarked ? t('article.removeBookmark') : t('article.bookmark')}
          </button>
          <button type="button" onClick={share} className={secondary}>
            <Share2 aria-hidden className="size-5" /> {shared ? t('story.linkCopied') : t('story.share')}
          </button>
          {shouldOfferTranslation(lang, locale) && (
            <a href={translatePageUrl(article.originalUrl, locale)} target="_blank" rel="noopener noreferrer" className={secondary} title={t('article.translateNote')}>
              <Languages aria-hidden className="size-5" /> {t('article.translatePage')}
              <span className="sr-only"> ({t('article.opensNewTab')})</span>
            </a>
          )}
        </div>
      </header>

      {article.imageUrl && (
        <img src={article.imageUrl} alt="" referrerPolicy="no-referrer" decoding="async" className="aspect-[16/9] w-full rounded-3xl object-cover" onError={(e) => (e.currentTarget.hidden = true)} />
      )}

      <section aria-labelledby="ai-title" className="flex flex-col gap-5 rounded-[2rem] border border-line bg-surface p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="ai-title" className="flex items-center gap-2 font-display text-xl font-bold">
            <Sparkles aria-hidden className="size-5 text-orange-ink" /> {t('story.aiBriefing')}
          </h2>
          <span className="rounded-full bg-sky-soft px-3 py-1 text-xs font-bold text-sky-ink">{t('story.aiLabel')}</span>
        </div>

        {insightState.status === 'loading' && (
          <div aria-hidden className="flex animate-pulse flex-col gap-3">
            <div className="h-4 w-full rounded bg-surface-2" />
            <div className="h-4 w-11/12 rounded bg-surface-2" />
            <div className="h-4 w-3/4 rounded bg-surface-2" />
          </div>
        )}

        {insightState.status === 'none' && <p className="text-muted">{t('story.aiPending')}</p>}

        {localized && insight && (
          <div lang={locale} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted">{t('story.summary')}</h3>
              <p className="text-lg leading-relaxed">{localized.summary}</p>
            </div>
            <div className="flex gap-4 rounded-3xl bg-cream p-5 text-[#1f1a14]">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-orange">
                <Lightbulb aria-hidden className="size-5" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="font-display font-bold">{t('story.impact')}</h3>
                <p>{localized.impact}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted">
                <ListChecks aria-hidden className="size-4" /> {t('story.keyPoints')}
              </h3>
              <ul className="flex flex-col gap-2">
                {localized.keyPoints.map((point, i) => (
                  <li key={i} className="flex gap-3">
                    <span aria-hidden className="mt-2.5 size-2 shrink-0 rounded-full bg-orange" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="border-t border-line pt-4 text-xs text-muted">
              {t('story.aiNote', { model: insight.model })}
              {insight.basedOn === 'excerpt' && <> {t('story.basedOnExcerpt')}</>}
            </p>
          </div>
        )}
      </section>

      {article.originalDescription && (
        <section aria-labelledby="source-title" className="flex flex-col gap-3">
          <h2 id="source-title" className="font-display text-xl font-bold">
            {t('story.fromSource')}
          </h2>
          <blockquote lang={lang ?? undefined} className="border-l-4 border-orange pl-4 text-lg text-muted">
            {article.originalDescription}
          </blockquote>
          <a href={article.originalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-fit items-center gap-1 font-bold text-orange-ink hover:underline">
            {t('story.readFullAt', { source: article.sourceName })} <ArrowUpRight aria-hidden className="size-4" />
            <span className="sr-only"> ({t('article.opensNewTab')})</span>
          </a>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="flex flex-col gap-4">
          <h2 id="related-title" className="font-display text-xl font-bold">
            {t('story.related')}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {related.map((a) => (
              <li key={a.id} className="min-w-0">
                <ArticleCard article={a} bookmarked={isBookmarked(a.id)} onToggleBookmark={onToggleBookmark} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
