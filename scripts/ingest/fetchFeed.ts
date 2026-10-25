export interface FetchOptions {
  allowedHosts: readonly string[]
  timeoutMs?: number
  maxBytes?: number
  maxRedirects?: number
  fetchImpl?: typeof fetch
}

export class FetchError extends Error {}

export const USER_AGENT = 'TNewIQBot/0.1 (+https://github.com/Chingmony/tnewiq)'

function assertAllowed(url: URL, allowedHosts: readonly string[]): void {
  if (url.protocol !== 'https:') throw new FetchError(`Refusing non-https URL: ${url.protocol}//${url.host}`)
  if (!allowedHosts.includes(url.hostname)) throw new FetchError(`Host not in allowlist: ${url.hostname}`)
}

async function readLimited(res: Response, maxBytes: number): Promise<string> {
  const declared = Number(res.headers.get('content-length'))
  if (declared > maxBytes) throw new FetchError(`Response too large (${declared} bytes)`)
  if (!res.body) return ''
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      throw new FetchError(`Response exceeded ${maxBytes} bytes`)
    }
    chunks.push(value)
  }
  return new TextDecoder('utf-8').decode(Buffer.concat(chunks))
}

/**
 * Fetches a configured feed. Only https URLs on allowlisted hosts are requested, including every redirect hop,
 * so feed content can never steer the collector to arbitrary addresses.
 */
export async function fetchFeed(rawUrl: string, opts: FetchOptions): Promise<string> {
  const { allowedHosts, timeoutMs = 20_000, maxBytes = 8 * 1024 * 1024, maxRedirects = 3, fetchImpl = fetch } = opts
  let url = new URL(rawUrl)
  for (let hop = 0; hop <= maxRedirects; hop++) {
    assertAllowed(url, allowedHosts)
    let res: Response
    try {
      res = await fetchImpl(url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
        headers: { 'user-agent': USER_AGENT, accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5' },
      })
    } catch (err) {
      const e = err as Error
      throw new FetchError(e.name === 'TimeoutError' ? `Timed out after ${timeoutMs} ms` : `Network error: ${e.message}`)
    }
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location')
      if (!location) throw new FetchError(`Redirect ${res.status} without Location`)
      url = new URL(location, url)
      continue
    }
    if (!res.ok) throw new FetchError(`HTTP ${res.status}`)
    return readLimited(res, maxBytes)
  }
  throw new FetchError(`Too many redirects (>${maxRedirects})`)
}
