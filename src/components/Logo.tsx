/** Radar Q: the Q of "IQ" drawn as a radar screen, with a sky-blue sweep and the Q's tail. */
export function LogoMark({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 128" className={className} aria-hidden="true">
      <rect width="128" height="128" rx="30" fill="#FF933E" />
      <circle cx="62" cy="62" r="34" fill="none" stroke="#FFF8E6" strokeWidth="13" />
      <path d="M62 62 L62 28 A34 34 0 0 1 91.4 45 Z" fill="#73A5CA" />
      <circle cx="62" cy="62" r="9" fill="#1F1A14" />
      <path d="M82 82 L102 102" stroke="#1F1A14" strokeWidth="14" strokeLinecap="round" />
      <circle cx="84" cy="38" r="5" fill="#FFCB56" />
    </svg>
  )
}

export function Wordmark() {
  return (
    <span className="font-display text-[1.4rem] font-extrabold tracking-tight text-ink">
      TNew<span className="text-orange-ink">IQ</span>
    </span>
  )
}
