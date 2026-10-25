import { useEffect, useState } from 'react'
import { InsightFileSchema, type InsightFile } from '../shared/insight'

export type InsightState = { status: 'loading' } | { status: 'none' } | { status: 'ready'; insight: InsightFile }

/**
 * Loads the AI insight for one article, if one has been generated.
 * An insight written for an older version of the article (different contentHash) is ignored.
 */
export function useInsight(articleId: string | null, contentHash: string | null, fetchImpl: typeof fetch = fetch): InsightState {
  const [state, setState] = useState<{ key: string; value: InsightState } | null>(null)
  const key = `${articleId}:${contentHash}`

  useEffect(() => {
    if (!articleId || !contentHash) return
    let active = true
    fetchImpl(`${import.meta.env.BASE_URL}data/insights/${articleId}.json`)
      .then(async (res) => {
        if (!res.ok) return { status: 'none' } as const
        const parsed = InsightFileSchema.safeParse(await res.json())
        if (!parsed.success || parsed.data.contentHash !== contentHash) return { status: 'none' } as const
        return { status: 'ready', insight: parsed.data } as const
      })
      .catch(() => ({ status: 'none' }) as const)
      .then((value) => active && setState({ key, value }))
    return () => {
      active = false
    }
  }, [articleId, contentHash, key, fetchImpl])

  if (!articleId || !contentHash) return { status: 'none' }
  return state?.key === key ? state.value : { status: 'loading' }
}
