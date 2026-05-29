import { useState } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useAuthPageSession, useResetGoogleLoading } from '../hooks/useAuthPage'
import { useTranslation } from '../hooks/useTranslation'
import { validateLoginForm, mapAuthError } from '../lib/authValidation'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import GoogleAuthButton from '../components/auth/GoogleAuthButton'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { signIn, signInWithGoogle } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const from = location.state?.from?.pathname || '/'
  const verified = searchParams.get('verified') === '1' || location.state?.verified

  useAuthPageSession()
  useResetGoogleLoading(setGoogleLoading)

  const validationMessages = {
    emailRequired: t('auth.validation.emailRequired'),
    emailInvalid: t('auth.validation.emailInvalid'),
    emailTooLong: t('auth.validation.emailTooLong'),
    passwordRequired: t('auth.validation.passwordRequired'),
    passwordShort: t('auth.validation.passwordShort'),
    invalidCredentials: t('auth.validation.invalidCredentials'),
    emailNotConfirmed: t('auth.validation.emailNotConfirmed'),
    authFailed: t('auth.validation.authFailed'),
  }

  function validateField(field) {
    const errors = validateLoginForm({ email, password }, validationMessages)
    setFieldErrors((prev) => ({ ...prev, [field]: errors[field] || '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const errors = validateLoginForm({ email, password }, validationMessages)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

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
      setError(mapAuthError(err.message, validationMessages))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setError('')
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message || t('auth.googleError'))
      setGoogleLoading(false)
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

      {verified && (
        <p className="mt-6 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-center text-sm text-success">
          {t('auth.emailVerifiedSignIn')}
        </p>
      )}

      <div className="mt-8 space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
        <GoogleAuthButton
          onClick={handleGoogleSignIn}
          loading={googleLoading}
          disabled={loading}
          label={t('auth.continueWithGoogle')}
        />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted">{t('auth.orEmail')}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (fieldErrors.email) validateField('email')
            }}
            onBlur={() => validateField('email')}
            error={fieldErrors.email}
            required
            autoComplete="email"
          />
          <Input
            label={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (fieldErrors.password) validateField('password')
            }}
            onBlur={() => validateField('password')}
            error={fieldErrors.password}
            required
            autoComplete="current-password"
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm font-medium text-accent hover:underline">
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <Button type="submit" className="w-full" disabled={loading || googleLoading}>
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="font-semibold text-accent hover:underline">
          {t('auth.register')}
        </Link>
      </p>
    </motion.div>
  )
}
