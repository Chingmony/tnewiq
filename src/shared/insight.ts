// AI-written story insights. Shared by the insight generator and the web app.
// One file per article at public/data/insights/<articleId>.json, loaded only on the story page.
import { z } from 'zod'

export const INSIGHT_LANGUAGES = ['en', 'km', 'zh-CN', 'ko'] as const
export type InsightLanguage = (typeof INSIGHT_LANGUAGES)[number]

export const INSIGHT_SCHEMA_VERSION = 1

export const LocalizedInsightSchema = z.object({
  title: z.string().min(1).max(300),
  summary: z.string().min(1).max(1200),
  impact: z.string().min(1).max(800),
  keyPoints: z.array(z.string().min(1).max(300)).min(1).max(5),
})

export type LocalizedInsight = z.infer<typeof LocalizedInsightSchema>

export const InsightFileSchema = z.object({
  schemaVersion: z.literal(INSIGHT_SCHEMA_VERSION),
  articleId: z.string().regex(/^[a-f0-9]{16}$/),
  /** The article contentHash this was written from; a changed article gets a new insight. */
  contentHash: z.string().regex(/^[a-f0-9]{16}$/),
  model: z.string().min(1).max(80),
  generatedAt: z.iso.datetime(),
  /** "feed-text" when the feed carried article text; "excerpt" when only the short excerpt was available. */
  basedOn: z.enum(['feed-text', 'excerpt']),
  languages: z.object({
    en: LocalizedInsightSchema,
    km: LocalizedInsightSchema,
    'zh-CN': LocalizedInsightSchema,
    ko: LocalizedInsightSchema,
  }),
})

export type InsightFile = z.infer<typeof InsightFileSchema>
