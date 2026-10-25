import { sortTime, type Article } from '../../src/shared/article.ts'
import { dedupe } from './dedupe.ts'

export interface MergeOptions {
  now: Date
  retentionDays: number
  maxArticles: number
}

/**
 * Combines stored articles with freshly fetched ones.
 * Stored articles keep their original discoveredAt; their content is replaced only if it changed.
 * Articles from sources that failed this run stay in place until they age out.
 */
export function mergeArticles(previous: readonly Article[], incoming: readonly Article[], opts: MergeOptions): Article[] {
  const merged = new Map(previous.map((a) => [a.id, a]))
  for (const fresh of incoming) {
    const old = merged.get(fresh.id)
    if (!old) merged.set(fresh.id, fresh)
    else if (old.contentHash !== fresh.contentHash) merged.set(fresh.id, { ...fresh, discoveredAt: old.discoveredAt })
  }

  const cutoff = opts.now.getTime() - opts.retentionDays * 24 * 60 * 60 * 1000
  return dedupe([...merged.values()])
    .filter((a) => sortTime(a) >= cutoff)
    .sort((a, b) => sortTime(b) - sortTime(a) || a.id.localeCompare(b.id))
    .slice(0, opts.maxArticles)
}
