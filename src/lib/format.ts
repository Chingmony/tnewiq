import type { Locale } from '../i18n'

export function formatDateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
]

export function formatRelative(iso: string, locale: Locale, now = Date.now()): string {
  const diff = Date.parse(iso) - now
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms || unit === 'minute') {
      if (unit === 'day' && Math.abs(diff) > 7 * ms) return formatDateTime(iso, locale)
      return rtf.format(Math.round(diff / ms), unit)
    }
  }
  return rtf.format(0, 'minute')
}
