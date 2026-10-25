import { useCallback, useEffect, useState } from 'react'
import { loadFeedData, type FeedData } from '../lib/data'
import { readJson, writeJson } from '../lib/storage'

type FeedState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: FeedData; downloadedAt: string | null }

const DOWNLOADED_KEY = 'downloadedAt'

async function fetchState(fetchImpl?: typeof fetch): Promise<FeedState> {
  try {
    const data = await loadFeedData(fetchImpl)
    // When offline the service worker answers from cache, so only record a download while online.
    if (navigator.onLine) writeJson(DOWNLOADED_KEY, new Date().toISOString())
    return { status: 'ready', data, downloadedAt: readJson<string | null>(DOWNLOADED_KEY, null) }
  } catch {
    return { status: 'error' }
  }
}

export function useFeed(fetchImpl?: typeof fetch) {
  const [state, setState] = useState<FeedState>({ status: 'loading' })

  useEffect(() => {
    let active = true
    void fetchState(fetchImpl).then((next) => active && setState(next))
    return () => {
      active = false
    }
  }, [fetchImpl])

  const reload = useCallback(async () => {
    setState({ status: 'loading' })
    setState(await fetchState(fetchImpl))
  }, [fetchImpl])

  return { state, reload }
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}
