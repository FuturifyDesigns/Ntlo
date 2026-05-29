import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MailCheck } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import Button from '../components/ui/Button'

export default function CheckEmail() {
  const { state } = useLocation()
  const [searchParams] = useSearchParams()
  const email = state?.email || searchParams.get('email') || 'your email'
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-md px-4 py-8 sm:py-10"
    >
      <div className="rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
        <img
          src={`${import.meta.env.BASE_URL}logo-brand.png`}
          alt="Ntlo"
          className="mx-auto mb-5 h-14 w-auto max-w-[200px]"
        />
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
          <MailCheck className="h-7 w-7 text-accent" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-primary">{t('auth.checkEmailTitle')}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {t('auth.checkEmailSubtitle', { email })}
        </p>
        <p className="mt-4 rounded-lg bg-background px-4 py-3 text-sm text-primary">
          {t('auth.checkEmailNote')}
        </p>
        <Button as={Link} to="/login?verified=0" state={{ verified: false }} className="mt-6 w-full">
          {t('auth.backToSignIn')}
        </Button>
      </div>
    </motion.div>
  )
}
