import { Feed } from '../components/Feed'
import { useI18n } from '../i18n'
import type { Article } from '../shared/article'
import { SectionTitle } from './HomeView'

interface Props {
  bookmarks: Article[]
  isBookmarked: (id: string) => boolean
  onToggleBookmark: (a: Article) => void
}

export function BookmarksView({ bookmarks, isBookmarked, onToggleBookmark }: Props) {
  const { t } = useI18n()
  return (
    <section aria-labelledby="bookmarks-title" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <SectionTitle id="bookmarks-title">{t('bookmarks.title')}</SectionTitle>
        <p className="text-muted">{t('bookmarks.note')}</p>
      </div>
      <Feed articles={bookmarks} isBookmarked={isBookmarked} onToggleBookmark={onToggleBookmark} empty={t('empty.bookmarks')} />
    </section>
  )
}
