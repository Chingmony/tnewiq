import { decode } from 'he'

/** Turns untrusted feed HTML into plain text. Script and style bodies are dropped entirely. */
export function toPlainText(input: unknown): string {
  if (typeof input !== 'string') return ''
  const withoutBlocks = input
    .replace(/<(script|style|iframe|object|noscript)\b[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
  const withoutTags = withoutBlocks.replace(/<\/?[a-z][^>]*>/gi, ' ')
  return decode(withoutTags)
    // oxlint-disable-next-line no-control-regex -- removing control characters is intentional
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Truncates by code points, preferring a word boundary for space-separated scripts. */
export function truncate(text: string, max: number): string {
  const chars = Array.from(text)
  if (chars.length <= max) return text
  let cut = chars.slice(0, max - 1).join('')
  const lastSpace = cut.lastIndexOf(' ')
  if (lastSpace > cut.length - 30 && lastSpace > 0) cut = cut.slice(0, lastSpace)
  return cut.replace(/[\s,.;:–—-]+$/u, '') + '…'
}
