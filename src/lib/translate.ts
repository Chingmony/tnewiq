import type { Locale } from '../i18n'

// Google Translate language codes for our interface locales.
const GOOGLE_CODES: Record<Locale, string> = { en: 'en', km: 'km', 'zh-CN': 'zh-CN', ko: 'ko' }

const base = (lang: string | null) => lang?.split('-')[0].toLowerCase() ?? null

/** Offer translation only when the article's language is known and differs from the interface language. */
export function shouldOfferTranslation(articleLanguage: string | null, locale: Locale): boolean {
  if (!articleLanguage) return true
  if (articleLanguage === locale) return false
  // zh-TW and zh-CN differ in script, so compare full tags for Chinese.
  if (base(articleLanguage) === 'zh' || base(locale) === 'zh') return articleLanguage !== locale
  return base(articleLanguage) !== base(locale)
}

/** Opens the public article page through Google Translate. Only the public URL is sent. */
export function translatePageUrl(articleUrl: string, target: Locale): string {
  const params = new URLSearchParams({ sl: 'auto', tl: GOOGLE_CODES[target], u: articleUrl })
  return `https://translate.google.com/translate?${params}`
}
