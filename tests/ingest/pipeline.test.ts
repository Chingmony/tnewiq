import { describe, expect, it } from 'vitest'
import { ArticlesFileSchema } from '../../src/shared/article.ts'
import { dedupe } from '../../scripts/ingest/dedupe.ts'
import { FetchError, fetchFeed } from '../../scripts/ingest/fetchFeed.ts'
import { mergeArticles } from '../../scripts/ingest/merge.ts'
import { runIngestion, summaryMarkdown } from '../../scripts/ingest/run.ts'
import { parseSourcesConfig } from '../../scripts/ingest/sources.ts'
import { NOW, article, fakeFetch, fixture, source } from './helpers.ts'

const xmlResponse = (body: string) => () => new Response(body, { status: 200, headers: { 'content-type': 'application/xml' } })
const noSleep = async () => {}

describe('dedupe', () => {
  it('collapses identical ids and keeps the first-discovered copy', () => {
    const a = article({ discoveredAt: '2026-10-24T05:00:00.000Z', sourceId: 'late' })
    const b = article({ discoveredAt: '2026-10-24T01:00:00.000Z', sourceId: 'early' })
    expect(dedupe([a, b])).toEqual([b])
  })

  it('collapses syndicated copies with the same headline', () => {
    const a = article({ id: '1111111111111111', originalTitle: 'Big Launch: New Chip Ships Today', originalUrl: 'https://a.com/x' })
    const b = article({ id: '2222222222222222', originalTitle: 'big launch — new chip ships today!', originalUrl: 'https://b.com/y', discoveredAt: '2026-10-24T09:00:00.000Z' })
    expect(dedupe([a, b]).map((x) => x.id)).toEqual(['1111111111111111'])
  })

  it('does not treat short generic titles as duplicates', () => {
    const a = article({ id: '1111111111111111', originalTitle: 'Release notes' })
    const b = article({ id: '2222222222222222', originalTitle: 'Release notes' })
    expect(dedupe([a, b])).toHaveLength(2)
  })
})

describe('mergeArticles', () => {
  const opts = { now: NOW, retentionDays: 30, maxArticles: 100 }

  it('preserves discoveredAt and updates changed content', () => {
    const old = article({ discoveredAt: '2026-10-20T00:00:00.000Z', contentHash: '0000000000000000' })
    const fresh = article({ discoveredAt: '2026-10-25T00:00:00.000Z', contentHash: '1111111111111111', originalTitle: 'Updated headline for the fixture' })
    const [merged] = mergeArticles([old], [fresh], opts)
    expect(merged.discoveredAt).toBe('2026-10-20T00:00:00.000Z')
    expect(merged.originalTitle).toBe('Updated headline for the fixture')
  })

  it('drops articles older than the retention window and sorts newest first', () => {
    const old = article({ id: '1111111111111111', originalTitle: 'An old article outside the window', publishedAt: '2026-08-01T00:00:00.000Z' })
    const a = article({ id: '2222222222222222', originalTitle: 'An article from the 22nd of October', publishedAt: '2026-10-22T00:00:00.000Z' })
    const b = article({ id: '3333333333333333', originalTitle: 'An article from the 24th of October', publishedAt: '2026-10-24T00:00:00.000Z' })
    expect(mergeArticles([old, a], [b], opts).map((x) => x.id)).toEqual(['3333333333333333', '2222222222222222'])
  })

  it('caps the number of stored articles', () => {
    const many = Array.from({ length: 5 }, (_, i) => article({ id: `${i}`.repeat(16), originalTitle: `Distinct fixture headline number ${i}` }))
    expect(mergeArticles([], many, { ...opts, maxArticles: 3 })).toHaveLength(3)
  })
})

describe('fetchFeed', () => {
  it('follows redirects only to allowlisted https hosts', async () => {
    const fetchImpl = fakeFetch({
      'https://example.com/feed': () => new Response(null, { status: 301, headers: { location: 'https://cdn.example.com/feed' } }),
      'https://cdn.example.com/feed': xmlResponse('<rss/>'),
    })
    await expect(fetchFeed('https://example.com/feed', { allowedHosts: ['example.com', 'cdn.example.com'], fetchImpl })).resolves.toBe('<rss/>')
    await expect(fetchFeed('https://example.com/feed', { allowedHosts: ['example.com'], fetchImpl })).rejects.toThrow(/not in allowlist/)
  })

  it('refuses http URLs and redirects to internal addresses', async () => {
    const fetchImpl = fakeFetch({
      'https://example.com/feed': () => new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/latest' } }),
    })
    await expect(fetchFeed('http://example.com/feed', { allowedHosts: ['example.com'], fetchImpl })).rejects.toThrow(/non-https/)
    await expect(fetchFeed('https://example.com/feed', { allowedHosts: ['example.com'], fetchImpl })).rejects.toThrow(FetchError)
  })

  it('stops after too many redirects', async () => {
    const fetchImpl = fakeFetch({ 'https://example.com/loop': () => new Response(null, { status: 302, headers: { location: '/loop' } }) })
    await expect(fetchFeed('https://example.com/loop', { allowedHosts: ['example.com'], fetchImpl })).rejects.toThrow(/Too many redirects/)
  })

  it('rejects oversized responses and HTTP errors', async () => {
    const fetchImpl = fakeFetch({
      'https://example.com/big': xmlResponse('x'.repeat(2000)),
      'https://example.com/missing': () => new Response('nope', { status: 404 }),
    })
    await expect(fetchFeed('https://example.com/big', { allowedHosts: ['example.com'], maxBytes: 1000, fetchImpl })).rejects.toThrow(/exceeded/)
    await expect(fetchFeed('https://example.com/missing', { allowedHosts: ['example.com'], fetchImpl })).rejects.toThrow('HTTP 404')
  })
})

describe('runIngestion', () => {
  const sources = [
    source({ id: 'en-feed', url: 'https://example.com/feed.xml' }),
    source({ id: 'ko-feed', name: 'Korean Fixture', url: 'https://example.kr/atom.xml', homepage: 'https://example.kr/', language: 'ko', topics: ['cloud-infrastructure'] }),
    source({ id: 'broken', name: 'Broken Fixture', url: 'https://broken.example/feed' }),
  ]
  const fetchImpl = fakeFetch({
    'https://example.com/feed.xml': xmlResponse(fixture('rss.xml')),
    'https://example.kr/atom.xml': xmlResponse(fixture('atom.xml')),
    'https://broken.example/feed': () => new Response('server error', { status: 500 }),
  })

  it('keeps results from healthy sources when another source fails', async () => {
    const run = await runIngestion({ sources, previous: null, now: NOW, fetchImpl, sleep: noSleep })
    expect(ArticlesFileSchema.safeParse(run.file).success).toBe(true)
    expect(run.results.find((r) => r.id === 'broken')).toMatchObject({ ok: false, error: 'HTTP 500' })
    expect(run.results.filter((r) => r.ok)).toHaveLength(2)
    expect(run.file.articles.some((a) => a.originalLanguage === 'ko')).toBe(true)
    expect(run.file.articles.some((a) => a.originalLanguage === 'en')).toBe(true)
    expect(summaryMarkdown(run)).toContain('2 / 3')
  })

  it('reports no change and keeps generatedAt when nothing new arrives', async () => {
    const first = await runIngestion({ sources, previous: null, now: NOW, fetchImpl, sleep: noSleep })
    const second = await runIngestion({ sources, previous: first.file, now: new Date('2026-10-25T01:00:00Z'), fetchImpl, sleep: noSleep })
    expect(second.changed).toBe(false)
    expect(second.added).toBe(0)
    expect(second.file.generatedAt).toBe(first.file.generatedAt)
  })

  it('retains previously stored articles from a source that is down', async () => {
    const first = await runIngestion({ sources, previous: null, now: NOW, fetchImpl, sleep: noSleep })
    const allDown = fakeFetch({})
    const second = await runIngestion({ sources, previous: first.file, now: new Date('2026-10-25T01:00:00Z'), fetchImpl: allDown, sleep: noSleep })
    expect(second.results.every((r) => !r.ok)).toBe(true)
    expect(second.file.articles).toEqual(first.file.articles)
  })

  it('waits between requests to the same host', async () => {
    const waits: number[] = []
    const sameHost = [source({ id: 'a', url: 'https://example.com/feed.xml' }), source({ id: 'b', url: 'https://example.com/feed.xml' })]
    await runIngestion({ sources: sameHost, previous: null, now: NOW, fetchImpl, sleep: async (ms) => void waits.push(ms) })
    expect(waits).toEqual([1000])
  })
})

describe('sources config', () => {
  it('rejects http feeds and duplicate ids', () => {
    expect(() => parseSourcesConfig({ sources: [{ ...source(), url: 'http://example.com/feed' }] })).toThrow()
    expect(() => parseSourcesConfig({ sources: [source(), source()] })).toThrow()
  })

  it('skips disabled sources', () => {
    expect(parseSourcesConfig({ sources: [source(), { ...source({ id: 'off' }), enabled: false }] }).map((s) => s.id)).toEqual(['fixture'])
  })
})
