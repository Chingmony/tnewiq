import { z } from 'zod'
import { TOPICS, isHttpUrl } from '../../src/shared/article.ts'

export const SourceConfigSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,64}$/),
  name: z.string().min(1).max(120),
  url: z.string().refine((v) => isHttpUrl(v, true), 'feed URL must be https'),
  homepage: z.string().refine((v) => isHttpUrl(v, true), 'homepage must be https'),
  language: z.string().min(2).max(16),
  topics: z.array(z.enum(TOPICS)).min(1).max(2),
  enabled: z.boolean().default(true),
  maxItems: z.number().int().min(1).max(100).default(25),
  /** Extra hosts a redirect may lead to. The feed's own host is always allowed. */
  allowedRedirectHosts: z.array(z.string()).default([]),
})

export type SourceConfig = z.infer<typeof SourceConfigSchema>

export const SourcesConfigSchema = z
  .object({ sources: z.array(SourceConfigSchema).min(1) })
  .refine((cfg) => new Set(cfg.sources.map((s) => s.id)).size === cfg.sources.length, 'source ids must be unique')

export function parseSourcesConfig(json: unknown): SourceConfig[] {
  return SourcesConfigSchema.parse(json).sources.filter((s) => s.enabled)
}
