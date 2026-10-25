import { Sparkles } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useI18n } from '../i18n'

/** Tells the user when a new version is ready instead of swapping it in silently. */
export function UpdatePrompt() {
  const { t } = useI18n()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh && !offlineReady) return null
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink p-3 pl-4 text-sm text-bg shadow-card md:bottom-6"
    >
      <Sparkles aria-hidden className="size-5 shrink-0 text-sun" />
      <span className="flex-1">{needRefresh ? t('status.updateAvailable') : t('status.offlineReady')}</span>
      {needRefresh && (
        <button type="button" onClick={() => void updateServiceWorker(true)} className="min-h-10 rounded-full bg-orange px-4 font-bold text-on-accent">
          {t('status.reload')}
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          setNeedRefresh(false)
          setOfflineReady(false)
        }}
        className="min-h-10 rounded-full px-3 font-semibold opacity-80 hover:opacity-100"
      >
        {t('status.dismiss')}
      </button>
    </div>
  )
}
