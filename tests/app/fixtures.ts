// Development/test fixtures. Never used by the production build. Not real articles.
import type { Article } from '../../src/shared/article'

const base = {
  originalDescription: null,
  imageUrl: null,
  contentHash: '0000000000000000',
  discoveredAt: '2026-10-25T00:00:00.000Z',
} as const

export const FIXTURE_ARTICLES: Article[] = [
  {
    ...base,
    id: '1111111111111111',
    sourceId: 'fixture-en',
    sourceName: 'Fixture English Source',
    originalTitle: 'Fixture: Rust compiler release improves build times',
    originalUrl: 'https://example.com/rust-release',
    originalLanguage: 'en',
    originalDescription: 'Example excerpt about incremental compilation.',
    publishedAt: '2026-10-24T22:00:00.000Z',
    topics: ['programming-languages'],
  },
  {
    ...base,
    id: '2222222222222222',
    sourceId: 'fixture-km',
    sourceName: 'ប្រភពសាកល្បង',
    originalTitle: 'ឧបករណ៍សន្តិសុខថ្មីសម្រាប់អ្នកអភិវឌ្ឍន៍',
    originalUrl: 'https://example.com/km-security',
    originalLanguage: 'km',
    publishedAt: '2026-10-24T20:00:00.000Z',
    topics: ['cybersecurity'],
  },
  {
    ...base,
    id: '3333333333333333',
    sourceId: 'fixture-zh',
    sourceName: '示例来源',
    originalTitle: '新一代移动芯片发布',
    originalUrl: 'https://example.cn/chip',
    originalLanguage: 'zh-CN',
    publishedAt: '2026-10-23T10:00:00.000Z',
    topics: ['mobile-hardware'],
  },
  {
    ...base,
    id: '4444444444444444',
    sourceId: 'fixture-ko',
    sourceName: '샘플 출처',
    originalTitle: '쿠버네티스 신규 버전 출시',
    originalUrl: 'https://example.kr/k8s',
    originalLanguage: 'ko',
    publishedAt: null,
    topics: ['cloud-infrastructure'],
  },
]

export function fixtureFetch(articles: Article[] = FIXTURE_ARTICLES): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = input.toString()
    if (url.endsWith('articles.json')) {
      return new Response(JSON.stringify({ schemaVersion: 1, generatedAt: '2026-10-25T00:00:00.000Z', articles }))
    }
    if (url.endsWith('sources.json')) return new Response(JSON.stringify({ schemaVersion: 1, sources: [] }))
    return new Response('not found', { status: 404 })
  }) as typeof fetch
}
