/** Radar mark: three signal arcs sweeping out from a sun-yellow source, on an orange tile. */
export function LogoMark({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#FF933E" />
      <g fill="none" stroke="#FFF4D6" strokeWidth="5.5" strokeLinecap="round">
        <path d="M18 30a16 16 0 0 1 16 16" />
        <path d="M18 20a26 26 0 0 1 26 26" opacity="0.8" />
        <path d="M18 10a36 36 0 0 1 36 36" opacity="0.55" />
      </g>
      <circle cx="19" cy="45" r="6" fill="#FFCB56" stroke="#1F1A14" strokeWidth="2.5" />
    </svg>
  )
}

export function Wordmark() {
  return (
    <span className="font-display text-[1.35rem] font-bold tracking-tight text-ink">
      TNew
      <span className="ml-0.5 rounded-md bg-orange px-1.5 py-0.5 text-[0.95rem] font-extrabold text-[#1f1a14]">IQ</span>
    </span>
  )
}
