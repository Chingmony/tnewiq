import { z } from 'zod'
import { ArticleSchema, SourcesFileSchema, type Article, type PublicSource } from '../shared/article'

export interface FeedData {
  generatedAt: string
  articles: Article[]
  /** Records that failed validation and were skipped. */
  rejected: number
}

export class DataLoadError extends Error {}

// Check the envelope strictly but each article individually, so one malformed record cannot hide the rest.
const Envelope = z.object({ schemaVersion: z.literal(1), generatedAt: z.iso.datetime(), articles: z.array(z.unknown()) })

export function parseFeedData(json: unknown): FeedData {
  const envelope = Envelope.safeParse(json)
  if (!envelope.success) throw new DataLoadError('articles.json has an unexpected format')
  const articles: Article[] = []
  let rejected = 0
  for (const item of envelope.data.articles) {
    const parsed = ArticleSchema.safeParse(item)
    if (parsed.success) articles.push(parsed.data)
    else rejected++
  }
  return { generatedAt: envelope.data.generatedAt, articles, rejected }
}

const dataUrl = (file: string) => `${import.meta.env.BASE_URL}data/${file}`

export async function loadFeedData(fetchImpl: typeof fetch = fetch): Promise<FeedData> {
  let res: Response
  try {
    res = await fetchImpl(dataUrl('articles.json'), { cache: 'no-cache' })
  } catch {
    throw new DataLoadError('Network error')
  }
  if (!res.ok) throw new DataLoadError(`HTTP ${res.status}`)
  return parseFeedData(await res.json())
}

export async function loadSources(fetchImpl: typeof fetch = fetch): Promise<PublicSource[]> {
  const res = await fetchImpl(dataUrl('sources.json'))
  if (!res.ok) return []
  const parsed = SourcesFileSchema.safeParse(await res.json())
  return parsed.success ? parsed.data.sources : []
}
