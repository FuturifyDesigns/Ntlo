import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, X } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'

function welcomeStorageKey(userId, notes) {
  return `ntlo_welcome_${userId}_${notes || '_'}`
}

export default function LandlordWelcomeBanner({ userId, profile }) {
  const { t } = useTranslation()
  const notes = profile?.verification_notes?.trim() || ''
  const storageKey = userId ? welcomeStorageKey(userId, notes) : null

  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!storageKey || profile?.verification_status !== 'approved') {
      setVisible(false)
      return
    }
    setVisible(!localStorage.getItem(storageKey))
  }, [storageKey, profile?.verification_status])

  function dismiss() {
    if (storageKey) localStorage.setItem(storageKey, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="mb-6 overflow-hidden rounded-xl border border-success/30 bg-success/5"
      >
        <div className="flex items-start gap-3 p-4 sm:p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold text-primary">
              {t('dashboard.welcomeVerifiedTitle', { name: profile?.full_name?.split(' ')[0] || 'there' })}
            </p>
            <p className="mt-1 text-sm text-muted">{t('dashboard.welcomeVerifiedBody')}</p>
            {notes && (
              <div className="mt-3 rounded-lg border border-success/20 bg-surface px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-success">
                  {t('dashboard.adminApprovalNote')}
                </p>
                <p className="mt-1 text-sm text-primary">{notes}</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-background hover:text-primary"
            aria-label={t('dashboard.dismissWelcome')}
          >
            <X size={18} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export { welcomeStorageKey }
