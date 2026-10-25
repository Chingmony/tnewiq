import type { Locale } from '../i18n'

// Some browsers (including desktop Chrome) ship ICU data without Khmer, so Intl silently falls back to English.
// For any locale the runtime cannot format, use these hand-written Khmer forms instead.
const KM_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ']
const KM_WEEKDAYS = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍']
const KM_RELATIVE = { minute: '{n} នាទីមុន', hour: '{n} ម៉ោងមុន', day: '{n} ថ្ងៃមុន', now: 'ឥឡូវនេះ', yesterday: 'ម្សិលមិញ' }

const supportCache = new Map<string, boolean>()

/** True when the runtime really has formatting data for the locale rather than falling back. */
export function intlSupports(locale: Locale): boolean {
  if (!supportCache.has(locale)) {
    const resolved = new Intl.DateTimeFormat(locale).resolvedOptions().locale
    supportCache.set(locale, resolved.split('-')[0] === locale.split('-')[0])
  }
  return supportCache.get(locale)!
}

const pad = (n: number) => String(n).padStart(2, '0')

export function khmerDate(date: Date): string {
  return `ថ្ងៃទី${date.getDate()} ខែ${KM_MONTHS[date.getMonth()]} ឆ្នាំ${date.getFullYear()}`
}

export function khmerWeekday(date: Date): string {
  return `ថ្ងៃ${KM_WEEKDAYS[date.getDay()]}`
}

export function khmerRelative(diffMs: number): string {
  const minutes = Math.round(Math.abs(diffMs) / 60_000)
  if (minutes < 1) return KM_RELATIVE.now
  if (minutes < 60) return KM_RELATIVE.minute.replace('{n}', String(minutes))
  const hours = Math.round(minutes / 60)
  if (hours < 24) return KM_RELATIVE.hour.replace('{n}', String(hours))
  const days = Math.round(hours / 24)
  return days === 1 ? KM_RELATIVE.yesterday : KM_RELATIVE.day.replace('{n}', String(days))
}

export function formatLongDate(date: Date, locale: Locale): string {
  if (locale === 'km' && !intlSupports(locale)) return khmerDate(date)
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

export function formatWeekday(date: Date, locale: Locale): string {
  if (locale === 'km' && !intlSupports(locale)) return khmerWeekday(date)
  return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date)
}

export function formatDateTime(iso: string, locale: Locale): string {
  const date = new Date(iso)
  if (locale === 'km' && !intlSupports(locale)) return `${khmerDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
]

export function formatRelative(iso: string, locale: Locale, now = Date.now()): string {
  const diff = Date.parse(iso) - now
  if (Math.abs(diff) > 7 * 86_400_000) return locale === 'km' && !intlSupports(locale) ? khmerDate(new Date(iso)) : formatDateTime(iso, locale)
  if (locale === 'km' && !intlSupports(locale)) return khmerRelative(diff)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms || unit === 'minute') return rtf.format(Math.round(diff / ms), unit)
  }
  return rtf.format(0, 'minute')
}
