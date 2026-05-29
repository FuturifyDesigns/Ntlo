import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../hooks/useTranslation'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await signIn(email, password)
      const role = data.user?.user_metadata?.role
      const destination =
        from !== '/login' && from !== '/'
          ? from
          : role === 'landlord'
            ? '/landlord'
            : '/student'
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid email or password')
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
        <img src={`${import.meta.env.BASE_URL}logo-brand.png`} alt="Ntlo" className="mx-auto mb-4 h-16 w-auto max-w-[220px]" />
        <h1 className="font-display text-3xl font-semibold tracking-tight text-primary">{t('auth.welcomeBack')}</h1>
        <p className="mt-2 text-muted">{t('auth.signInSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
        <Input
          label={t('auth.email')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label={t('auth.password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {error && <p className="text-sm text-error">{error}</p>}
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-accent hover:underline">
            {t('auth.forgotPassword')}
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="font-semibold text-accent hover:underline">
          {t('auth.register')}
        </Link>
      </p>
    </motion.div>
  )
}
