import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../hooks/useTranslation'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { resetPassword } = useAuth()
  const { t } = useTranslation()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.message || 'Could not send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-md px-4 py-8 sm:py-10"
    >
      <div className="text-center">
        <img
          src={`${import.meta.env.BASE_URL}logo-brand.png`}
          alt="Ntlo"
          className="mx-auto mb-4 h-16 w-auto max-w-[220px]"
        />
        {!sent ? (
          <>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-primary">
              {t('auth.forgotTitle')}
            </h1>
            <p className="mt-2 text-muted">{t('auth.forgotSubtitle')}</p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
              <Mail className="h-7 w-7 text-accent" />
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-primary">
              {t('auth.resetSentTitle')}
            </h1>
            <p className="mt-2 text-muted">{t('auth.resetSentSubtitle', { email })}</p>
          </>
        )}
      </div>

      {!sent ? (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
          <Input
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('auth.sendingReset') : t('auth.sendResetLink')}
          </Button>
        </form>
      ) : (
        <div className="mt-8 rounded-xl border border-border bg-surface p-6 text-center shadow-sm">
          <Button as={Link} to="/login" variant="outline" className="w-full">
            {t('auth.backToSignIn')}
          </Button>
        </div>
      )}

      {!sent && (
        <p className="mt-6 text-center text-sm text-muted">
          <Link to="/login" className="font-semibold text-accent hover:underline">
            {t('auth.backToSignIn')}
          </Link>
        </p>
      )}
    </motion.div>
  )
}
