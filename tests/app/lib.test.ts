import { describe, expect, it } from 'vitest'
import { DICTIONARIES, LOCALES, translate } from '../../src/i18n'
import { DataLoadError, parseFeedData } from '../../src/lib/data'
import { briefingStats, filterArticles, matchesQuery, pickFeatured } from '../../src/lib/filter'
import { shouldOfferTranslation, translatePageUrl } from '../../src/lib/translate'
import { TOPICS } from '../../src/shared/article'
import { createManifest } from '../../src/pwa/manifest'
import { FIXTURE_ARTICLES } from './fixtures'

describe('locale dictionaries', () => {
  const enKeys = Object.keys(DICTIONARIES.en).sort()

  it.each(LOCALES)('%s has exactly the same keys as English', (locale) => {
    expect(Object.keys(DICTIONARIES[locale]).sort()).toEqual(enKeys)
  })

  it.each(LOCALES)('%s has no empty strings and keeps every placeholder', (locale) => {
    for (const key of enKeys as Array<keyof typeof DICTIONARIES.en>) {
      const value = DICTIONARIES[locale][key]
      expect(value.trim(), `${locale}:${key}`).not.toBe('')
      const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort()
      expect(placeholders(value), `${locale}:${key}`).toEqual(placeholders(DICTIONARIES.en[key]))
    }
  })

  it('covers all eight topics in every language', () => {
    for (const locale of LOCALES) for (const topic of TOPICS) expect(DICTIONARIES[locale][`topic.${topic}`]).toBeTruthy()
  })

  it('stores Khmer as real Khmer script', () => {
    expect(DICTIONARIES.km['nav.home']).toMatch(/^[ក-៿\s]+$/)
  })

  it('interpolates variables', () => {
    expect(translate('zh-CN', 'search.results', { count: 3 })).toBe('3 条结果')
    expect(translate('km', 'search.results', { count: 3 })).toBe('លទ្ធផល 3')
  })
})

describe('filtering and search', () => {
  it('matches across scripts, case-insensitively, requiring every term', () => {
    const [en, km] = FIXTURE_ARTICLES
    expect(matchesQuery(en, 'RUST build')).toBe(true)
    expect(matchesQuery(en, 'rust python')).toBe(false)
    expect(matchesQuery(km, 'សន្តិសុខ')).toBe(true)
  })

  it('filters by topic and sorts by date, with undated items using discovery time', () => {
    expect(filterArticles(FIXTURE_ARTICLES, { query: '', topic: 'cybersecurity', sort: 'newest' }).map((a) => a.id)).toEqual(['2222222222222222'])
    const oldest = filterArticles(FIXTURE_ARTICLES, { query: '', topic: null, sort: 'oldest' }).map((a) => a.id)
    expect(oldest[0]).toBe('3333333333333333')
  })

  it('computes briefing numbers only from dated articles in the last 24 hours', () => {
    expect(briefingStats(FIXTURE_ARTICLES, new Date('2026-10-25T06:00:00Z'))).toEqual({ count: 2, sources: 2 })
  })

  it('never features an undated article', () => {
    expect(pickFeatured(FIXTURE_ARTICLES)?.id).toBe('1111111111111111')
    expect(pickFeatured([FIXTURE_ARTICLES[3]])).toBeNull()
  })
})

describe('feed data validation', () => {
  it('skips invalid records without discarding valid ones', () => {
    const data = parseFeedData({
      schemaVersion: 1,
      generatedAt: '2026-10-25T00:00:00.000Z',
      articles: [FIXTURE_ARTICLES[0], { ...FIXTURE_ARTICLES[1], originalUrl: 'javascript:alert(1)' }],
    })
    expect(data.articles).toHaveLength(1)
    expect(data.rejected).toBe(1)
  })

  it('rejects an unknown schema version', () => {
    expect(() => parseFeedData({ schemaVersion: 2, generatedAt: '2026-10-25T00:00:00.000Z', articles: [] })).toThrow(DataLoadError)
  })
})

describe('external translation', () => {
  it('is offered only when languages differ', () => {
    expect(shouldOfferTranslation('en', 'en')).toBe(false)
    expect(shouldOfferTranslation('en-US', 'en')).toBe(false)
    expect(shouldOfferTranslation('ko', 'en')).toBe(true)
    expect(shouldOfferTranslation('zh-TW', 'zh-CN')).toBe(true)
    expect(shouldOfferTranslation(null, 'km')).toBe(true)
  })

  it('builds a Google Translate link that carries only the public URL', () => {
    const url = new URL(translatePageUrl('https://example.com/a?b=1', 'km'))
    expect(url.origin).toBe('https://translate.google.com')
    expect(url.searchParams.get('tl')).toBe('km')
    expect(url.searchParams.get('u')).toBe('https://example.com/a?b=1')
  })
})

describe('web app manifest', () => {
  const manifest = createManifest('/tnewiq/')
  it('meets installability requirements', () => {
    expect(manifest.name).toBe('TNewIQ')
    expect(manifest.start_url).toBe('/tnewiq/')
    expect(manifest.scope).toBe('/tnewiq/')
    expect(manifest.display).toBe('standalone')
    const sizes = manifest.icons?.map((i) => i.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
    expect(manifest.icons?.some((i) => i.purpose === 'maskable')).toBe(true)
  })
})

describe('Khmer date fallback', () => {
  it('formats dates, weekdays and relative times in Khmer without Intl data', async () => {
    const { khmerDate, khmerWeekday, khmerRelative } = await import('../../src/lib/format')
    const d = new Date(2026, 9, 25, 14, 5)
    expect(khmerDate(d)).toBe('ថ្ងៃទី25 ខែតុលា ឆ្នាំ2026')
    expect(khmerWeekday(d)).toBe('ថ្ងៃអាទិត្យ')
    expect(khmerRelative(-28 * 60_000)).toBe('28 នាទីមុន')
    expect(khmerRelative(-3 * 3_600_000)).toBe('3 ម៉ោងមុន')
    expect(khmerRelative(-30 * 3_600_000)).toBe('ម្សិលមិញ')
    expect(khmerRelative(-10_000)).toBe('ឥឡូវនេះ')
  })
})
