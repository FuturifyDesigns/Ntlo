import { useState } from 'react'
import { Info } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { useTranslation } from '../../hooks/useTranslation'

const STORAGE_KEY = 'ntlo_web_listings_notice_v1'

/**
 * One-time browse notice: some rooms are web-discovered; verify with the owner.
 * Ntlo is advertising-only for these posts.
 */
export default function WebListingsNotice() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(() => {
    try {
      return !sessionStorage.getItem(STORAGE_KEY)
    } catch {
      return true
    }
  })

  function dismiss() {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch { /* ignore */ }
    setOpen(false)
  }

  return (
    <Modal open={open} onClose={dismiss} title={t('listings.webNoticeTitle')} size="md">
      <div className="space-y-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <Info size={20} />
        </div>
        <p className="text-sm leading-relaxed text-muted">{t('listings.webNoticeIntro')}</p>
        <p className="text-sm leading-relaxed text-primary">{t('listings.webNoticeVerify')}</p>
        <p className="rounded-xl border border-border bg-background px-4 py-3 text-xs leading-relaxed text-muted">
          {t('listings.webNoticeLiability')}
        </p>
        <Button type="button" className="w-full" onClick={dismiss}>
          {t('listings.webNoticeGotIt')}
        </Button>
      </div>
    </Modal>
  )
}
