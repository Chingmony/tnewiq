import { useCallback, useEffect, useState } from 'react'
import { ArticleSchema, type Article } from '../shared/article'
import { readJson, removeKey, writeJson } from '../lib/storage'

const KEY = 'bookmarks'

// Bookmarks store the full record so they still work offline and after the article ages out of the feed.
function load(): Article[] {
  const raw = readJson<unknown>(KEY, [])
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    const parsed = ArticleSchema.safeParse(item)
    return parsed.success ? [parsed.data] : []
  })
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Article[]>(load)

  // Keep several open tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === `tnewiq.${KEY}`) setBookmarks(load())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const isBookmarked = useCallback((id: string) => bookmarks.some((b) => b.id === id), [bookmarks])

  const toggle = useCallback((article: Article) => {
    setBookmarks((current) => {
      const next = current.some((b) => b.id === article.id) ? current.filter((b) => b.id !== article.id) : [article, ...current]
      writeJson(KEY, next)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    removeKey(KEY)
    setBookmarks([])
  }, [])

  return { bookmarks, isBookmarked, toggle, clear }
}
