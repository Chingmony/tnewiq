import { useI18n } from '../i18n'
import { formatLongDate, formatWeekday } from '../lib/format'

interface Props {
  now: Date
  newCount: number
  sourceCount: number
  total: number
}

/** Opening panel: today's date and counts computed from the collected data. Nothing here is estimated. */
export function BriefingHero({ now, newCount, sourceCount, total }: Props) {
  const { t, locale } = useI18n()
  // Wide letter-spacing suits Latin capitals but pulls apart Khmer clusters and CJK characters.
  const eyebrow = locale === 'en' ? 'uppercase tracking-[0.14em]' : ''

  return (
    <section aria-labelledby="briefing-title" className="relative overflow-hidden rounded-[2rem] bg-cream p-6 text-[#1f1a14] sm:p-8 md:p-10">
      <RadarRings />
      <div className="relative flex max-w-xl flex-col gap-4">
        <p className={`text-sm font-bold text-[#8a4a12] ${eyebrow}`}>
          <span id="briefing-title">{t('briefing.title')}</span> · {formatWeekday(now, locale)}
        </p>
        <p className="font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">{formatLongDate(now, locale)}</p>
        <p className="max-w-md text-base sm:text-lg">
          {newCount > 0 ? t('briefing.summary', { count: newCount, sources: sourceCount }) : t('briefing.none')}
        </p>
        <ul className="flex flex-wrap gap-2 pt-1 text-sm font-bold">
          <li className="rounded-full bg-orange px-3.5 py-1.5">{t('briefing.newCount', { count: newCount })}</li>
          <li className="rounded-full bg-[#fff8e4] px-3.5 py-1.5">{t('briefing.sourceCount', { count: sourceCount })}</li>
          <li className="rounded-full bg-sky px-3.5 py-1.5">{t('briefing.storedCount', { count: total })}</li>
        </ul>
      </div>
    </section>
  )
}

/** Decorative radar sweep in the palette colours. Everything stays inside the viewBox, so no hard clipped edges. */
function RadarRings() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 300 300"
      className="pointer-events-none absolute -bottom-32 -right-32 size-72 opacity-60 sm:-bottom-24 sm:-right-16 sm:size-[22rem] sm:opacity-90 md:-bottom-16 md:right-0"
    >
      <circle cx="150" cy="150" r="145" fill="#ffcb56" opacity="0.35" />
      <circle cx="150" cy="150" r="108" fill="#ffcb56" opacity="0.5" />
      <circle cx="150" cy="150" r="70" fill="#ff933e" opacity="0.55" />
      <circle cx="150" cy="150" r="30" fill="#ff933e" />
      <path d="M150 150 L150 5 A145 145 0 0 1 275.6 77.5 Z" fill="#73a5ca" opacity="0.5" />
      <circle cx="205" cy="70" r="6" fill="#1f1a14" />
      <circle cx="95" cy="112" r="4.5" fill="#1f1a14" opacity="0.7" />
    </svg>
  )
}
