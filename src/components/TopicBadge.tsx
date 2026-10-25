import { useI18n, type MessageKey } from '../i18n'
import { TONE_CLASSES, TOPIC_META } from '../lib/topics'
import type { Topic } from '../shared/article'

export function TopicBadge({ topic }: { topic: Topic }) {
  const { t } = useI18n()
  const { icon: Icon, tone } = TOPIC_META[topic]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[tone]}`}>
      <Icon aria-hidden className="size-3.5" strokeWidth={2.25} />
      {t(`topic.${topic}` as MessageKey)}
    </span>
  )
}
