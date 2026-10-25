import { sortTime, type Article } from '../../src/shared/article.ts'

/** Loose key for spotting the same headline syndicated under different URLs. */
export function titleKey(title: string): string {
  return title.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
}

function earlier(a: Article, b: Article): Article {
  const byDiscovery = Date.parse(a.discoveredAt) - Date.parse(b.discoveredAt)
  if (byDiscovery !== 0) return byDiscovery < 0 ? a : b
  return sortTime(a) <= sortTime(b) ? a : b
}

/** Removes duplicates by id (canonical URL), then by near-identical headline. Keeps the first-seen copy. */
export function dedupe(articles: readonly Article[]): Article[] {
  const byId = new Map<string, Article>()
  for (const article of articles) {
    const existing = byId.get(article.id)
    byId.set(article.id, existing ? earlier(existing, article) : article)
  }

  const byTitle = new Map<string, Article>()
  const result: Article[] = []
  for (const article of byId.values()) {
    const key = titleKey(article.originalTitle)
    // Short headlines ("Release notes") collide too easily to be treated as duplicates.
    if (key.length < 16) {
      result.push(article)
      continue
    }
    const existing = byTitle.get(key)
    byTitle.set(key, existing ? earlier(existing, article) : article)
  }
  return [...result, ...byTitle.values()]
}
