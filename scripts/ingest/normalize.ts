import { createHash } from 'node:crypto'
import type { Article } from '../../src/shared/article.ts'
import type { RawItem } from './parseFeed.ts'
import type { SourceConfig } from './sources.ts'
import { classify } from './classify.ts'
import { toPlainText, truncate } from './text.ts'

export const MAX_TITLE = 300
export const MAX_DESCRIPTION = 280
const FUTURE_TOLERANCE_MS = 24 * 60 * 60 * 1000

const TRACKING_PARAMS = /^(utm_[a-z]+|fbclid|gclid|mc_cid|mc_eid|_hsenc|_hsmi|mkt_tok)$/i

export function hash16(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16)
}

/** Resolves, validates and canonicalizes a link. Returns null for anything that is not http(s). */
export function canonicalizeUrl(raw: string | null, base?: string): string | null {
  if (!raw) return null
  let url: URL
  try {
    url = new URL(raw.trim(), base)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (url.username || url.password) return null
  url.hash = ''
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.test(key)) url.searchParams.delete(key)
  }
  url.hostname = url.hostname.toLowerCase()
  return url.toString()
}

/** Parses a feed date. Missing, invalid or implausibly future dates become null. */
export function normalizeDate(raw: string | null, now: Date): string | null {
  if (!raw) return null
  const time = Date.parse(raw.trim())
  if (Number.isNaN(time)) return null
  if (time > now.getTime() + FUTURE_TOLERANCE_MS) return null
  if (time < Date.UTC(1990, 0, 1)) return null
  return new Date(time).toISOString()
}

export function normalizeItem(raw: RawItem, source: SourceConfig, now: Date): Article | null {
  const title = truncate(toPlainText(raw.title), MAX_TITLE)
  const originalUrl = canonicalizeUrl(raw.link, source.homepage) ?? canonicalizeUrl(raw.guid, source.homepage)
  if (!title || !originalUrl) return null

  const descriptionText = toPlainText(raw.description)
  const originalDescription = descriptionText ? truncate(descriptionText, MAX_DESCRIPTION) : null
  const image = canonicalizeUrl(raw.imageUrl, source.homepage)

  return {
    id: hash16(originalUrl),
    sourceId: source.id,
    sourceName: source.name,
    originalTitle: title,
    originalUrl,
    originalLanguage: source.language,
    originalDescription,
    publishedAt: normalizeDate(raw.published, now) ?? normalizeDate(raw.updated, now),
    discoveredAt: now.toISOString(),
    topics: classify(title, source.topics),
    imageUrl: image?.startsWith('https:') ? image : null,
    contentHash: hash16(`${title}\n${originalDescription ?? ''}`),
  }
}
