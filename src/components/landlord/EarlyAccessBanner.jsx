import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, X, CreditCard } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'

const STORAGE_KEY = 'ntlo_early_access_banner'

export default function EarlyAccessBanner() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(() => {
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
    setVisible(false)
  }

  if (!visible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="mb-6 overflow-hidden rounded-xl border border-accent/30 bg-gradient-to-r from-accent/10 to-surface"
      >
        <div className="flex items-start gap-3 p-4 sm:p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Gift size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-bold text-primary">{t('billing.earlyAccessBannerTitle')}</p>
            <p className="mt-1 text-sm text-muted">{t('billing.earlyAccessBannerBody')}</p>
            <Link
              to="/landlord/billing"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
            >
              <CreditCard size={14} />
              {t('billing.viewPlans')}
            </Link>
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
