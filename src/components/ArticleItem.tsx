import { Bookmark, BookmarkCheck, Copy, ExternalLink, Languages } from 'lucide-react'
import { useState } from 'react'
import { useI18n, type MessageKey } from '../i18n'
import { formatDateTime } from '../lib/format'
import { shouldOfferTranslation, translatePageUrl } from '../lib/translate'
import type { Article } from '../shared/article'

interface Props {
  article: Article
  bookmarked: boolean
  onToggleBookmark: (article: Article) => void
}

const KNOWN_LANGS = ['en', 'km', 'zh-CN', 'ko']

export function ArticleItem({ article, bookmarked, onToggleBookmark }: Props) {
  const { t, locale } = useI18n()
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const lang = article.originalLanguage
  const langLabel = t((lang && KNOWN_LANGS.includes(lang) ? `langName.${lang}` : 'langName.unknown') as MessageKey)

  async function copy() {
    const text = [article.originalTitle, article.originalDescription, article.originalUrl].filter(Boolean).join('\n\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <article className="article" aria-labelledby={`title-${article.id}`}>
      <p className="meta">
        {article.topics.map((topic) => t(`topic.${topic}` as MessageKey)).join(' · ')}
      </p>
      <h3 id={`title-${article.id}`} lang={lang ?? undefined}>
        <a href={article.originalUrl} target="_blank" rel="noopener noreferrer">
          {article.originalTitle}
        </a>
      </h3>
      {article.originalDescription && <p lang={lang ?? undefined}>{article.originalDescription}</p>}
      <p className="meta">
        <span>{article.sourceName}</span>
        {' · '}
        {article.publishedAt ? (
          <time dateTime={article.publishedAt}>{t('article.published', { date: formatDateTime(article.publishedAt, locale) })}</time>
        ) : (
          <span>
            {t('article.dateUnknown')} ({t('article.firstSeen', { date: formatDateTime(article.discoveredAt, locale) })})
          </span>
        )}
        {' · '}
        <span>{t('article.originalLanguage', { language: langLabel })}</span>
      </p>
      <div className="actions">
        <a href={article.originalUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink aria-hidden size={16} /> {t('article.readOriginal')}
          <span className="sr-only"> ({t('article.opensNewTab')})</span>
        </a>
        <button type="button" aria-pressed={bookmarked} onClick={() => onToggleBookmark(article)}>
          {bookmarked ? <BookmarkCheck aria-hidden size={16} /> : <Bookmark aria-hidden size={16} />}{' '}
          {bookmarked ? t('article.removeBookmark') : t('article.bookmark')}
        </button>
        {shouldOfferTranslation(lang, locale) && (
          <a href={translatePageUrl(article.originalUrl, locale)} target="_blank" rel="noopener noreferrer" title={t('article.translateNote')}>
            <Languages aria-hidden size={16} /> {t('article.translatePage')}
            <span className="sr-only"> ({t('article.opensNewTab')})</span>
          </a>
        )}
        <button type="button" onClick={copy}>
          <Copy aria-hidden size={16} /> {t('article.copyText')}
        </button>
        <span role="status">
          {copyState === 'copied' && t('article.copied')}
          {copyState === 'failed' && t('article.copyFailed')}
        </span>
      </div>
    </article>
  )
}
