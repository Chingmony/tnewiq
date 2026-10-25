import { SCHEMA_VERSION, sortTime, type Article, type ArticlesFile } from '../../src/shared/article.ts'
import { fetchFeed } from './fetchFeed.ts'
import { mergeArticles } from './merge.ts'
import { normalizeItem } from './normalize.ts'
import { parseFeed } from './parseFeed.ts'
import type { SourceConfig } from './sources.ts'
import { toPlainText, truncate } from './text.ts'

export const RETENTION_DAYS = 30
export const MAX_ARTICLES = 1500
/** Upper bound on feed text kept as AI input per article. */
const MAX_CONTEXT_CHARS = 4000
/** Delay between two requests to the same host. arXiv asks API clients to wait 3 seconds. */
const HOST_DELAY_MS: Record<string, number> = { 'export.arxiv.org': 3500 }
const DEFAULT_HOST_DELAY_MS = 1000
const HOST_CONCURRENCY = 4

export interface SourceResult {
  id: string
  name: string
  ok: boolean
  fetched: number
  kept: number
  error: string | null
  durationMs: number
}

export interface RunResult {
  file: ArticlesFile
  changed: boolean
  results: SourceResult[]
  added: number
  /**
   * Longer plain-text article bodies some feeds include, keyed by article id.
   * Used only as input for AI insights; never published or committed.
   */
  contexts: Record<string, string>
}

export interface RunOptions {
  sources: readonly SourceConfig[]
  previous: ArticlesFile | null
  now?: Date
  fetchImpl?: typeof fetch
  sleep?: (ms: number) => Promise<void>
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

async function collectSource(source: SourceConfig, now: Date, fetchImpl?: typeof fetch) {
  const host = new URL(source.url).hostname
  const xml = await fetchFeed(source.url, { allowedHosts: [host, ...source.allowedRedirectHosts], fetchImpl })
  const raw = parseFeed(xml)
  const cutoff = now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000
  const contexts: Record<string, string> = {}
  const items: Article[] = []
  for (const r of raw) {
    const article = normalizeItem(r, source, now)
    if (!article || (article.publishedAt !== null && Date.parse(article.publishedAt) < cutoff)) continue
    items.push(article)
    const text = toPlainText(r.content)
    if (text.length > (article.originalDescription?.length ?? 0) + 40) contexts[article.id] = truncate(text, MAX_CONTEXT_CHARS)
  }
  // Feeds are usually newest first, but not always; undated items keep their feed order.
  const dated = items.filter((a) => a.publishedAt).sort((a, b) => sortTime(b) - sortTime(a))
  const undated = items.filter((a) => !a.publishedAt)
  const articles = [...dated, ...undated].slice(0, source.maxItems)
  return { fetched: raw.length, articles, contexts: Object.fromEntries(articles.filter((a) => contexts[a.id]).map((a) => [a.id, contexts[a.id]])) }
}

export async function runIngestion(opts: RunOptions): Promise<RunResult> {
  const now = opts.now ?? new Date()
  const sleep = opts.sleep ?? defaultSleep

  // Group by host so each host is fetched sequentially (polite), while different hosts run in parallel.
  const groups = new Map<string, SourceConfig[]>()
  for (const s of opts.sources) {
    const host = new URL(s.url).hostname
    groups.set(host, [...(groups.get(host) ?? []), s])
  }

  const results: SourceResult[] = []
  const incoming: Article[] = []
  const contexts: Record<string, string> = {}
  const queue = [...groups.entries()]
  async function worker() {
    for (let next = queue.shift(); next; next = queue.shift()) {
      const [host, sources] = next
      for (const [i, source] of sources.entries()) {
        if (i > 0) await sleep(HOST_DELAY_MS[host] ?? DEFAULT_HOST_DELAY_MS)
        const started = Date.now()
        try {
          const { fetched, articles, contexts: found } = await collectSource(source, now, opts.fetchImpl)
          incoming.push(...articles)
          Object.assign(contexts, found)
          results.push({ id: source.id, name: source.name, ok: true, fetched, kept: articles.length, error: null, durationMs: Date.now() - started })
        } catch (err) {
          results.push({ id: source.id, name: source.name, ok: false, fetched: 0, kept: 0, error: (err as Error).message.slice(0, 200), durationMs: Date.now() - started })
        }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(HOST_CONCURRENCY, queue.length) }, worker))
  results.sort((a, b) => a.id.localeCompare(b.id))

  const previousArticles = opts.previous?.articles ?? []
  const articles = mergeArticles(previousArticles, incoming, { now, retentionDays: RETENTION_DAYS, maxArticles: MAX_ARTICLES })
  const changed = JSON.stringify(articles) !== JSON.stringify(previousArticles)
  const previousIds = new Set(previousArticles.map((a) => a.id))

  return {
    file: {
      schemaVersion: SCHEMA_VERSION,
      // Only moves forward when the content actually changed, so unchanged runs produce no commit.
      generatedAt: changed || !opts.previous ? now.toISOString() : opts.previous.generatedAt,
      articles,
    },
    changed,
    results,
    added: articles.filter((a) => !previousIds.has(a.id)).length,
    contexts,
  }
}

export function summaryMarkdown(run: RunResult): string {
  const ok = run.results.filter((r) => r.ok).length
  const lines = [
    '## TNewIQ ingestion',
    '',
    `- Sources succeeded: **${ok} / ${run.results.length}**`,
    `- New articles: **${run.added}**`,
    `- Articles stored: **${run.file.articles.length}**`,
    `- Data changed: **${run.changed ? 'yes' : 'no'}**`,
    '',
    '| Source | Result | Items in feed | Kept | Time |',
    '| --- | --- | ---: | ---: | ---: |',
    ...run.results.map(
      (r) => `| ${r.name} | ${r.ok ? 'ok' : `failed: ${r.error?.replace(/\|/g, '/')}`} | ${r.fetched} | ${r.kept} | ${(r.durationMs / 1000).toFixed(1)} s |`,
    ),
  ]
  return lines.join('\n') + '\n'
}
