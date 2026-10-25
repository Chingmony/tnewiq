import { describe, expect, it } from 'vitest'
import { ArticleSchema } from '../../src/shared/article.ts'
import { classify } from '../../scripts/ingest/classify.ts'
import { canonicalizeUrl, normalizeDate, normalizeItem } from '../../scripts/ingest/normalize.ts'
import { FeedParseError, parseFeed } from '../../scripts/ingest/parseFeed.ts'
import { toPlainText, truncate } from '../../scripts/ingest/text.ts'
import { NOW, fixture, source } from './helpers.ts'

describe('parseFeed', () => {
  it('parses RSS 2.0 items', () => {
    const items = parseFeed(fixture('rss.xml'))
    expect(items).toHaveLength(5)
    expect(items[0]).toMatchObject({ title: 'Fixture: LLM toolkit & agents ship version 2', guid: 'fixture-1', imageUrl: 'https://example.com/thumb.jpg' })
  })

  it('parses Atom entries and picks the alternate html link', () => {
    const items = parseFeed(fixture('atom.xml'))
    expect(items).toHaveLength(2)
    expect(items[0].link).toBe('https://example.kr/posts/k8s-security')
    expect(items[1].link).toBe('https://example.cn/news/1')
    expect(items[1].published).toBeNull()
    expect(items[1].updated).toBe('2026-10-22T08:00:00Z')
  })

  it('parses RSS 1.0 (RDF)', () => {
    const xml = `<?xml version="1.0"?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://purl.org/rss/1.0/" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <item><title>RDF item</title><link>https://example.org/rdf</link><dc:date>2026-10-20T00:00:00Z</dc:date></item></rdf:RDF>`
    expect(parseFeed(xml)).toEqual([expect.objectContaining({ title: 'RDF item', link: 'https://example.org/rdf', published: '2026-10-20T00:00:00Z' })])
  })

  it('rejects documents that declare entities', () => {
    const xml = '<?xml version="1.0"?><!DOCTYPE x [<!ENTITY a "aaaa">]><rss><channel><item><title>&a;</title></item></channel></rss>'
    expect(() => parseFeed(xml)).toThrow(FeedParseError)
  })

  it('rejects HTML pages and invalid XML', () => {
    expect(() => parseFeed('<html><body>Not a feed</body></html>')).toThrow(FeedParseError)
    expect(() => parseFeed('<rss><channel><item>')).toThrow(FeedParseError)
  })
})

describe('text cleaning', () => {
  it('strips tags, scripts and entities', () => {
    expect(toPlainText('<p>The <b>toolkit</b></p><script>alert(1)</script>&nbsp;&amp; more')).toBe('The toolkit & more')
  })

  it('truncates on code points without splitting Khmer or CJK characters', () => {
    const km = 'អត្ថបទសាកល្បងជាភាសាខ្មែរ'
    const out = truncate(km, 10)
    expect(Array.from(out)).toHaveLength(10)
    expect(out.endsWith('…')).toBe(true)
    expect(truncate('short', 10)).toBe('short')
  })
})

describe('canonicalizeUrl', () => {
  it('removes tracking parameters and fragments, keeps meaningful ones', () => {
    expect(canonicalizeUrl('https://Example.com/p?utm_source=x&id=7#top')).toBe('https://example.com/p?id=7')
  })
  it('resolves relative links against the source homepage', () => {
    expect(canonicalizeUrl('/a/b', 'https://example.com/')).toBe('https://example.com/a/b')
  })
  it('rejects non-http schemes and credentials', () => {
    expect(canonicalizeUrl('javascript:alert(1)')).toBeNull()
    expect(canonicalizeUrl('data:text/html,hi')).toBeNull()
    expect(canonicalizeUrl('https://user:pw@example.com/')).toBeNull()
    expect(canonicalizeUrl(null)).toBeNull()
  })
})

describe('normalizeDate', () => {
  it('normalizes RFC 822 and ISO dates to UTC ISO strings', () => {
    expect(normalizeDate('Fri, 23 Oct 2026 09:30:00 GMT', NOW)).toBe('2026-10-23T09:30:00.000Z')
    expect(normalizeDate('2026-10-24T03:00:00+07:00', NOW)).toBe('2026-10-23T20:00:00.000Z')
  })
  it('returns null instead of inventing a date', () => {
    expect(normalizeDate('not a date', NOW)).toBeNull()
    expect(normalizeDate(null, NOW)).toBeNull()
    expect(normalizeDate('Mon, 01 Jan 2035 00:00:00 GMT', NOW)).toBeNull()
  })
})

describe('normalizeItem', () => {
  const items = parseFeed(fixture('rss.xml'))
  const normalized = items.map((i) => normalizeItem(i, source(), NOW))

  it('produces records that satisfy the schema', () => {
    for (const a of normalized.filter(Boolean)) expect(ArticleSchema.safeParse(a).success).toBe(true)
  })

  it('sanitizes descriptions and canonicalizes links', () => {
    const first = normalized[0]!
    expect(first.originalUrl).toBe('https://example.com/posts/llm-toolkit?id=7')
    expect(first.originalDescription).toBe('The toolkit adds streaming. Read more')
    expect(first.originalDescription).not.toMatch(/alert|<|onerror/)
  })

  it('keeps Khmer titles intact and resolves relative links', () => {
    const km = normalizeItem(items[1], source({ language: 'km' }), NOW)!
    expect(km.originalTitle).toBe('ឧបករណ៍ AI ថ្មីសម្រាប់អ្នកអភិវឌ្ឍន៍')
    expect(km.originalUrl).toBe('https://example.com/km/posts/new-ai-tool')
    expect(km.originalLanguage).toBe('km')
  })

  it('stores null for unknown dates and drops items with unsafe links', () => {
    expect(normalized[2]!.publishedAt).toBeNull()
    expect(normalized[3]).toBeNull()
  })

  it('refuses insecure image URLs', () => {
    expect(normalized[4]!.imageUrl).toBeNull()
  })

  it('falls back to the Atom updated date when published is missing', () => {
    const [, zh] = parseFeed(fixture('atom.xml'))
    const a = normalizeItem(zh, source({ language: 'zh-CN', homepage: 'https://example.cn/' }), NOW)!
    expect(a.publishedAt).toBe('2026-10-22T08:00:00.000Z')
    expect(a.originalDescription).toBe('这是测试用的中文内容。')
  })

  it('derives a stable id from the canonical URL', () => {
    const again = normalizeItem(items[0], source({ id: 'other-source' }), new Date('2026-10-26T00:00:00Z'))!
    expect(again.id).toBe(normalized[0]!.id)
  })
})

describe('classify', () => {
  it('keeps source topics first and adds keyword topics', () => {
    expect(classify('New LLM benchmark released', ['developer-tools'])).toEqual(['developer-tools', 'ai'])
  })
  it('matches Korean, Chinese and Khmer keywords', () => {
    expect(classify('쿠버네티스 보안 점검', ['developer-tools'])).toEqual(['developer-tools', 'cybersecurity', 'cloud-infrastructure'])
    expect(classify('新一代开源芯片发布', ['startups-products'])).toEqual(['startups-products', 'mobile-hardware', 'developer-tools'])
    expect(classify('បញ្ញាសិប្បនិម្មិតថ្មី', ['research-papers'])).toEqual(['research-papers', 'ai'])
  })
  it('does not over-match common words', () => {
    expect(classify('Said the founders on the go', ['startups-products'])).toEqual(['startups-products'])
    expect(classify('Maintaining a garden', ['developer-tools'])).toEqual(['developer-tools'])
  })
  it('never returns more than three topics', () => {
    expect(classify('AI malware hits Kubernetes iPhone startup', ['research-papers']).length).toBeLessThanOrEqual(3)
  })
})
