import { ArrowUpRight, Bookmark, BookmarkCheck, Check, Copy, Languages } from 'lucide-react'
import { useState } from 'react'
import { useI18n, type MessageKey } from '../i18n'
import { formatDateTime, formatRelative } from '../lib/format'
import { shouldOfferTranslation, translatePageUrl } from '../lib/translate'
import type { Article } from '../shared/article'
import { TopicBadge } from './TopicBadge'

interface Props {
  article: Article
  bookmarked: boolean
  onToggleBookmark: (article: Article) => void
  variant?: 'default' | 'featured'
}

const KNOWN_LANGS = ['en', 'km', 'zh-CN', 'ko']
const LANG_CODES: Record<string, string> = { en: 'EN', km: 'KM', 'zh-CN': '中文', ko: '한국어' }

const iconButton =
  'inline-flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink'

export function ArticleCard({ article, bookmarked, onToggleBookmark, variant = 'default' }: Props) {
  const { t, locale } = useI18n()
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [imageFailed, setImageFailed] = useState(false)
  const lang = article.originalLanguage
  const langName = t((lang && KNOWN_LANGS.includes(lang) ? `langName.${lang}` : 'langName.unknown') as MessageKey)
  const featured = variant === 'featured'
  const showImage = article.imageUrl && !imageFailed

  async function copy() {
    const text = [article.originalTitle, article.originalDescription, article.originalUrl].filter(Boolean).join('\n\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
    window.setTimeout(() => setCopyState('idle'), 2500)
  }

  return (
    <article
      aria-labelledby={`title-${article.id}`}
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-card transition-transform duration-200 hover:-translate-y-0.5 ${
        featured ? 'md:flex-row' : ''
      }`}
    >
      {featured && <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-orange md:w-2" />}
      {showImage && (
        <div className={featured ? 'aspect-[16/9] md:order-2 md:aspect-auto md:w-2/5' : 'aspect-[16/9]'}>
          <img
            src={article.imageUrl!}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="size-full object-cover"
          />
        </div>
      )}

      <div className={`flex min-w-0 flex-1 flex-col gap-3 ${featured ? 'p-6 md:p-8' : 'p-5'}`}>
        <div className="flex flex-wrap items-center gap-2">
          {article.topics.slice(0, 2).map((topic) => (
            <TopicBadge key={topic} topic={topic} />
          ))}
          {lang && (
            <span title={t('article.originalLanguage', { language: langName })} className="ml-auto rounded-md border border-line px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-muted">
              <span aria-hidden>{LANG_CODES[lang] ?? lang.toUpperCase()}</span>
              <span className="sr-only">{t('article.originalLanguage', { language: langName })}</span>
            </span>
          )}
        </div>

        <h3
          id={`title-${article.id}`}
          lang={lang ?? undefined}
          className={`font-display font-semibold leading-snug tracking-tight text-ink ${featured ? 'text-2xl md:text-[2rem] md:leading-tight' : 'text-lg'}`}
        >
          <a href={article.originalUrl} target="_blank" rel="noopener noreferrer" className="headline-link">
            {article.originalTitle}
          </a>
        </h3>

        {article.originalDescription && (
          <p lang={lang ?? undefined} className={`text-muted ${featured ? 'line-clamp-4 text-base' : 'line-clamp-3 text-sm'}`}>
            {article.originalDescription}
          </p>
        )}

        <p className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-sm text-muted">
          <span className="font-semibold text-ink">{article.sourceName}</span>
          <span aria-hidden>·</span>
          {article.publishedAt ? (
            <time dateTime={article.publishedAt} title={t('article.published', { date: formatDateTime(article.publishedAt, locale) })}>
              {formatRelative(article.publishedAt, locale)}
            </time>
          ) : (
            <span title={t('article.firstSeen', { date: formatDateTime(article.discoveredAt, locale) })}>{t('article.dateUnknown')}</span>
          )}
        </p>

        <div className="-mb-1 flex items-center gap-1 border-t border-line pt-3">
          <a
            href={article.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mr-auto inline-flex min-h-11 items-center gap-1.5 rounded-full bg-orange px-4 text-sm font-bold text-on-accent transition-colors hover:bg-sun"
          >
            {t('article.readOriginal')}
            <ArrowUpRight aria-hidden className="size-4" strokeWidth={2.5} />
            <span className="sr-only"> ({t('article.opensNewTab')})</span>
          </a>
          {shouldOfferTranslation(lang, locale) && (
            <a
              href={translatePageUrl(article.originalUrl, locale)}
              target="_blank"
              rel="noopener noreferrer"
              className={iconButton}
              aria-label={`${t('article.translatePage')} (${t('article.opensNewTab')})`}
              title={t('article.translateNote')}
            >
              <Languages aria-hidden className="size-5" />
            </a>
          )}
          <button type="button" onClick={copy} className={iconButton} aria-label={t('article.copyText')} title={t('article.copyText')}>
            {copyState === 'copied' ? <Check aria-hidden className="size-5 text-sky-ink" /> : <Copy aria-hidden className="size-5" />}
          </button>
          <button
            type="button"
            aria-pressed={bookmarked}
            onClick={() => onToggleBookmark(article)}
            className={`${iconButton} ${bookmarked ? 'text-orange-ink' : ''}`}
            aria-label={bookmarked ? t('article.removeBookmark') : t('article.bookmark')}
            title={bookmarked ? t('article.removeBookmark') : t('article.bookmark')}
          >
            {bookmarked ? <BookmarkCheck aria-hidden className="size-5" fill="currentColor" strokeWidth={1.5} /> : <Bookmark aria-hidden className="size-5" />}
          </button>
          <span role="status" className="sr-only">
            {copyState === 'copied' && t('article.copied')}
            {copyState === 'failed' && t('article.copyFailed')}
          </span>
        </div>
        {copyState === 'failed' && <p className="text-sm text-orange-ink">{t('article.copyFailed')}</p>}
      </div>
    </article>
  )
}

export function ArticleCardSkeleton() {
  return (
    <div aria-hidden className="flex animate-pulse flex-col gap-3 rounded-3xl border border-line bg-surface p-5">
      <div className="h-6 w-28 rounded-full bg-surface-2" />
      <div className="h-5 w-full rounded bg-surface-2" />
      <div className="h-5 w-4/5 rounded bg-surface-2" />
      <div className="h-4 w-2/3 rounded bg-surface-2" />
      <div className="mt-3 h-11 w-36 rounded-full bg-surface-2" />
    </div>
  )
}
