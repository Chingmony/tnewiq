import en from '../locales/en.json'
import km from '../locales/km.json'
import ko from '../locales/ko.json'
import zhCN from '../locales/zh-CN.json'

export const LOCALES = ['en', 'km', 'zh-CN', 'ko'] as const
export type Locale = (typeof LOCALES)[number]
export type MessageKey = keyof typeof en
type Dictionary = Record<MessageKey, string>

export const DICTIONARIES: Record<Locale, Dictionary> = { en, km, 'zh-CN': zhCN, ko }

/** Each language's own name, shown in the language picker regardless of the current interface language. */
export const ENDONYMS: Record<Locale, string> = { en: 'English', km: 'ខ្មែរ', 'zh-CN': '简体中文', ko: '한국어' }

export const DEFAULT_LOCALE: Locale = 'en'
export const LOCALE_STORAGE_KEY = 'locale'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

export function translate(locale: Locale, key: MessageKey, vars?: Record<string, string | number>): string {
  const template = DICTIONARIES[locale][key] ?? DICTIONARIES.en[key] ?? key
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match))
}
