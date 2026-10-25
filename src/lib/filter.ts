import { sortTime, type Article, type Topic } from '../shared/article'

export type SortOrder = 'newest' | 'oldest'

export interface FeedQuery {
  query: string
  topic: Topic | null
  sort: SortOrder
}

const fold = (s: string) => s.normalize('NFKC').toLocaleLowerCase()

/** Every whitespace-separated term must appear in the headline, excerpt or source name. */
export function matchesQuery(article: Article, query: string): boolean {
  const terms = fold(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true
  const haystack = fold(`${article.originalTitle} ${article.originalDescription ?? ''} ${article.sourceName}`)
  return terms.every((term) => haystack.includes(term))
}

export function filterArticles(articles: readonly Article[], { query, topic, sort }: FeedQuery): Article[] {
  const result = articles.filter((a) => (topic === null || a.topics.includes(topic)) && matchesQuery(a, query))
  const dir = sort === 'newest' ? -1 : 1
  return result.sort((a, b) => dir * (sortTime(a) - sortTime(b)) || a.id.localeCompare(b.id))
}

/** Counts for the briefing, computed only from collected data. */
export function briefingStats(articles: readonly Article[], now: Date): { count: number; sources: number } {
  const since = now.getTime() - 24 * 60 * 60 * 1000
  const recent = articles.filter((a) => a.publishedAt !== null && Date.parse(a.publishedAt) >= since)
  return { count: recent.length, sources: new Set(recent.map((a) => a.sourceId)).size }
}

/** The featured story is the newest dated article; undated items are never featured. */
export function pickFeatured(articles: readonly Article[]): Article | null {
  let best: Article | null = null
  for (const a of articles) {
    if (a.publishedAt && (!best || Date.parse(a.publishedAt) > Date.parse(best.publishedAt!))) best = a
  }
  return best
}
