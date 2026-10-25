import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Article } from '../../src/shared/article.ts'
import type { SourceConfig } from '../../scripts/ingest/sources.ts'

export const NOW = new Date('2026-10-25T00:00:00Z')

export function fixture(name: string): string {
  return readFileSync(path.join(import.meta.dirname, '../fixtures', name), 'utf8')
}

export function source(overrides: Partial<SourceConfig> = {}): SourceConfig {
  return {
    id: 'fixture',
    name: 'Fixture Source',
    url: 'https://example.com/feed.xml',
    homepage: 'https://example.com/',
    language: 'en',
    topics: ['developer-tools'],
    enabled: true,
    maxItems: 25,
    allowedRedirectHosts: [],
    ...overrides,
  }
}

export function article(overrides: Partial<Article> = {}): Article {
  return {
    id: 'aaaaaaaaaaaaaaaa',
    sourceId: 'fixture',
    sourceName: 'Fixture Source',
    originalTitle: 'A fixture headline that is long enough',
    originalUrl: 'https://example.com/a',
    originalLanguage: 'en',
    originalDescription: null,
    publishedAt: '2026-10-24T00:00:00.000Z',
    discoveredAt: '2026-10-24T01:00:00.000Z',
    topics: ['ai'],
    imageUrl: null,
    contentHash: '0000000000000000',
    ...overrides,
  }
}

/** A fake fetch that serves canned responses keyed by URL. */
export function fakeFetch(routes: Record<string, () => Response>): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = input instanceof Request ? input.url : input.toString()
    const route = routes[url]
    if (!route) throw new TypeError(`fetch failed: no route for ${url}`)
    return route()
  }) as typeof fetch
}
