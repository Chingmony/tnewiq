import { LayoutGrid } from 'lucide-react'
import { useI18n } from '../i18n'
import { TOPIC_META } from '../lib/topics'
import { TOPICS, type Topic } from '../shared/article'

interface Props {
  value: Topic | null
  onChange: (topic: Topic | null) => void
}

const base =
  'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors'
const on = 'border-ink bg-ink text-bg'
const off = 'border-line bg-surface text-ink hover:border-orange hover:bg-orange-soft'

/** Horizontally scrolling topic filter. Each chip is a toggle button. */
export function TopicChips({ value, onChange }: Props) {
  const { t } = useI18n()
  return (
    <div role="group" aria-label={t('topic.filterLabel')} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
      <button type="button" aria-pressed={value === null} className={`${base} ${value === null ? on : off}`} onClick={() => onChange(null)}>
        <LayoutGrid aria-hidden className="size-4" />
        {t('topic.all')}
      </button>
      {TOPICS.map((topic) => {
        const Icon = TOPIC_META[topic].icon
        const active = value === topic
        return (
          <button
            key={topic}
            type="button"
            aria-pressed={active}
            className={`${base} ${active ? on : off}`}
            onClick={() => onChange(active ? null : topic)}
          >
            <Icon aria-hidden className={`size-4 ${active ? 'text-orange' : 'text-orange-ink'}`} />
            {t(`topic.${topic}`)}
          </button>
        )
      })}
    </div>
  )
}
