import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Building2, Sparkles, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../ui/Button'

const STORAGE_KEY = 'ntlo_guest_welcome_v1'

export default function WelcomeGuestModal() {
  const { user, loading } = useAuth()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (loading || user) return
    try {
      if (localStorage.getItem(STORAGE_KEY)) return
    } catch {
      return
    }
    const timer = window.setTimeout(() => setOpen(true), 600)
    return () => clearTimeout(timer)
  }, [loading, user])

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore
    }
    setOpen(false)
  }

  if (user || loading) return null

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[190] flex items-end justify-center p-4 sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
            onClick={dismiss}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16 }}
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg rounded-2xl border border-accent/30 bg-surface p-6 shadow-2xl sm:p-8"
          >
            <button
              type="button"
              onClick={dismiss}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-muted hover:bg-background hover:text-primary"
              aria-label={t('onboarding.close')}
            >
              <X size={18} />
            </button>

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <Sparkles size={24} />
            </div>
            <h2 className="font-display text-2xl font-semibold text-primary">{t('onboarding.guest.title')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t('onboarding.guest.subtitle')}</p>

            <div className="mt-6 space-y-3">
              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <GraduationCap size={20} />
                  </span>
                  <div>
                    <p className="font-semibold text-primary">{t('onboarding.guest.studentTitle')}</p>
                    <p className="mt-1 text-sm text-muted">{t('onboarding.guest.studentBody')}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                    <Building2 size={20} />
                  </span>
                  <div>
                    <p className="font-semibold text-primary">{t('onboarding.guest.landlordTitle')}</p>
                    <p className="mt-1 text-sm text-muted">{t('onboarding.guest.landlordBody')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button as={Link} to="/register?role=student" onClick={dismiss}>
                {t('onboarding.guest.signUpStudent')}
              </Button>
              <Button as={Link} to="/register?role=landlord" variant="outline" onClick={dismiss}>
                {t('onboarding.guest.signUpLandlord')}
              </Button>
              <Button type="button" variant="outline" onClick={dismiss} className="sm:ml-auto">
                {t('onboarding.guest.browseFirst')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
