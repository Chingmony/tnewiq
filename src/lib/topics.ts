import { BrainCircuit, Braces, Cloud, FlaskConical, Rocket, ShieldCheck, Smartphone, Wrench, type LucideIcon } from 'lucide-react'
import type { Topic } from '../shared/article'

export type Tone = 'orange' | 'sun' | 'sky'

export const TOPIC_META: Record<Topic, { icon: LucideIcon; tone: Tone }> = {
  ai: { icon: BrainCircuit, tone: 'orange' },
  cybersecurity: { icon: ShieldCheck, tone: 'sky' },
  'developer-tools': { icon: Wrench, tone: 'sun' },
  'programming-languages': { icon: Braces, tone: 'orange' },
  'cloud-infrastructure': { icon: Cloud, tone: 'sky' },
  'startups-products': { icon: Rocket, tone: 'sun' },
  'research-papers': { icon: FlaskConical, tone: 'sky' },
  'mobile-hardware': { icon: Smartphone, tone: 'orange' },
}

/** Tailwind classes for a soft tinted badge in each palette tone. Text always uses an accessible ink colour. */
export const TONE_CLASSES: Record<Tone, string> = {
  orange: 'bg-orange-soft text-orange-ink',
  sun: 'bg-sun-soft text-ink',
  sky: 'bg-sky-soft text-sky-ink',
}
