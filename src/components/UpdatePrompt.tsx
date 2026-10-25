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
    <div role="status" className="banner">
      {needRefresh ? t('status.updateAvailable') : t('status.offlineReady')}{' '}
      {needRefresh && (
        <button type="button" onClick={() => void updateServiceWorker(true)}>
          {t('status.reload')}
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          setNeedRefresh(false)
          setOfflineReady(false)
        }}
      >
        {t('status.dismiss')}
      </button>
    </div>
  )
}
