// Shared between the ingestion scripts and the web app.
// Fields that a feed does not provide are null, never invented.
import { z } from 'zod'

export const TOPICS = [
  'ai',
  'cybersecurity',
  'developer-tools',
  'programming-languages',
  'cloud-infrastructure',
  'startups-products',
  'research-papers',
  'mobile-hardware',
] as const

export type Topic = (typeof TOPICS)[number]

export const SCHEMA_VERSION = 1

export function isHttpUrl(value: string, httpsOnly = false): boolean {
  try {
    const url = new URL(value)
    return httpsOnly ? url.protocol === 'https:' : url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

const hash16 = z.string().regex(/^[a-f0-9]{16}$/)
const isoDate = z.iso.datetime()

export const ArticleSchema = z.object({
  id: hash16,
  sourceId: z.string().regex(/^[a-z0-9-]{1,64}$/),
  sourceName: z.string().min(1).max(120),
  originalTitle: z.string().min(1).max(400),
  originalUrl: z.string().max(2048).refine((v) => isHttpUrl(v), 'must be an http(s) URL'),
  originalLanguage: z.string().max(16).nullable(),
  originalDescription: z.string().max(600).nullable(),
  publishedAt: isoDate.nullable(),
  discoveredAt: isoDate,
  topics: z.array(z.enum(TOPICS)).min(1).max(3),
  imageUrl: z
    .string()
    .max(2048)
    .refine((v) => isHttpUrl(v, true), 'must be an https URL')
    .nullable(),
  contentHash: hash16,
})

export type Article = z.infer<typeof ArticleSchema>

export const ArticlesFileSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  generatedAt: isoDate,
  articles: z.array(ArticleSchema),
})

export type ArticlesFile = z.infer<typeof ArticlesFileSchema>

export const PublicSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  homepage: z.string().refine((v) => isHttpUrl(v, true)),
  language: z.string(),
  topics: z.array(z.enum(TOPICS)),
})

export const SourcesFileSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  sources: z.array(PublicSourceSchema),
})

export type PublicSource = z.infer<typeof PublicSourceSchema>

/** Sort key: publication date when known, otherwise when TNewIQ first saw it. */
export function sortTime(article: Pick<Article, 'publishedAt' | 'discoveredAt'>): number {
  return Date.parse(article.publishedAt ?? article.discoveredAt)
}
