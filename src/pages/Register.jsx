import { useState, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useGoogleAuth } from '../hooks/useGoogleAuth'
import { submitUniversityRequest } from '../hooks/useStats'
import { useTranslation } from '../hooks/useTranslation'
import { validateRegisterForm, mapAuthError, normalizeBotswanaPhone } from '../lib/authValidation'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import PasswordInput from '../components/ui/PasswordInput'
import GoogleAuthButton from '../components/auth/GoogleAuthButton'
import AuthTransitionOverlay from '../components/auth/AuthTransitionOverlay'
import { UniversitySelect } from '../components/universities/OtherUniversityModal'

export default function Register() {
  const [searchParams] = useSearchParams()
  const defaultRole = searchParams.get('role') === 'landlord' ? 'landlord' : 'student'
  const { t } = useTranslation()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: defaultRole,
    universityId: '',
    customUniversity: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleGoogleError = useCallback((message) => {
    setError(message)
  }, [])

  const { startGoogleAuth, googleLoading, authReady, googleDisabled } = useGoogleAuth({
    role: form.role,
    onError: handleGoogleError,
  })

  const validationMessages = {
    nameRequired: t('auth.validation.nameRequired'),
    nameMin: t('auth.validation.nameMin'),
    nameMax: t('auth.validation.nameMax'),
    nameInvalid: t('auth.validation.nameInvalid'),
    emailRequired: t('auth.validation.emailRequired'),
    emailInvalid: t('auth.validation.emailInvalid'),
    emailTooLong: t('auth.validation.emailTooLong'),
    passwordRequired: t('auth.validation.passwordRequired'),
    passwordMin: t('auth.validation.passwordMin'),
    passwordLower: t('auth.validation.passwordLower'),
    passwordUpper: t('auth.validation.passwordUpper'),
    passwordNumber: t('auth.validation.passwordNumber'),
    passwordSpaces: t('auth.validation.passwordSpaces'),
    confirmPasswordRequired: t('auth.validation.confirmPasswordRequired'),
    passwordMismatch: t('auth.validation.passwordMismatch'),
    phoneRequired: t('auth.validation.phoneRequired'),
    phoneInvalid: t('auth.validation.phoneInvalid'),
    universityRequired: t('auth.validation.universityRequired'),
    universityMin: t('auth.validation.universityMin'),
    emailTaken: t('auth.validation.emailTaken'),
    authFailed: t('auth.validation.authFailed'),
  }

  function getFormSnapshot(overrides = {}) {
    return { ...form, ...overrides }
  }

  function update(field, value) {
    const next = getFormSnapshot({ [field]: value })
    setForm(next)
    if (fieldErrors[field] || (field === 'password' && fieldErrors.confirmPassword)) {
      const errors = validateRegisterForm(next, validationMessages)
      setFieldErrors((prev) => ({
        ...prev,
        [field]: errors[field] || '',
        ...(field === 'password' ? { confirmPassword: errors.confirmPassword || '' } : {}),
      }))
    }
  }

  function validateField(field) {
    const errors = validateRegisterForm(form, validationMessages)
    setFieldErrors((prev) => ({ ...prev, [field]: errors[field] || '' }))
    if (field === 'password' && form.confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: errors.confirmPassword || '' }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const errors = validateRegisterForm(form, validationMessages)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const normalizedPhone = normalizeBotswanaPhone(form.phone.trim())

    setLoading(true)
    try {
      const data = await signUp({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        role: form.role,
        phone: normalizedPhone,
      })

      if (form.role === 'student' && form.universityId === 'other' && form.customUniversity.trim()) {
        try {
          await submitUniversityRequest({
            name: form.customUniversity.trim(),
            city: 'Botswana',
            email: form.email.trim(),
          })
        } catch {
          // Non-blocking
        }
      }

      if (data.user && !data.session) {
        navigate('/check-email', { state: { email: form.email.trim() } })
        return
      }

      if (data.user && !data.user.email_confirmed_at && !data.user.confirmed_at) {
        navigate('/check-email', { state: { email: form.email.trim() } })
        return
      }

      navigate(form.role === 'landlord' ? '/landlord' : '/student')
    } catch (err) {
      setError(mapAuthError(err.message, validationMessages))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AuthTransitionOverlay
        show={transitioning || googleLoading}
        message={googleLoading ? t('auth.googleSigningIn') : t('auth.signingInSmooth')}
        hint={googleLoading ? t('auth.googleSigningInHint') : undefined}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mx-auto max-w-md px-4 py-8 sm:py-10"
      >
      <div className="text-center">
        <img src={`${import.meta.env.BASE_URL}logo-brand.png`} alt="Ntlo" className="mx-auto mb-4 h-16 w-auto max-w-[220px]" />
        <h1 className="font-display text-3xl font-semibold tracking-tight text-primary">{t('auth.joinNtlo')}</h1>
        <p className="mt-2 text-muted">{t('auth.joinSubtitle')}</p>
      </div>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => update('role', 'student')}
          className={`flex-1 rounded-lg border py-3 text-sm font-semibold transition-colors ${
            form.role === 'student'
              ? 'border-accent bg-accent/15 text-primary'
              : 'border-border text-muted hover:border-accent/50'
          }`}
        >
          {t('auth.lookingForRoom')}
        </button>
        <button
          type="button"
          onClick={() => update('role', 'landlord')}
          className={`flex-1 rounded-lg border py-3 text-sm font-semibold transition-colors ${
            form.role === 'landlord'
              ? 'border-accent bg-accent/15 text-primary'
              : 'border-border text-muted hover:border-accent/50'
          }`}
        >
          {t('auth.haveRoom')}
        </button>
      </div>

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
        <GoogleAuthButton
          onClick={startGoogleAuth}
          loading={googleLoading}
          disabled={loading || googleDisabled}
          label={t('auth.signUpWithGoogle')}
        />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted">{t('auth.orEmail')}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <p className="text-xs text-muted">{t('auth.requiredFieldsNote')}</p>
          <Input
            label={t('auth.fullName')}
            value={form.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            onBlur={() => validateField('fullName')}
            error={fieldErrors.fullName}
            hint={!fieldErrors.fullName ? t('auth.nameHint') : undefined}
            required
            autoComplete="name"
          />
          <Input
            label={t('auth.email')}
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            onBlur={() => validateField('email')}
            error={fieldErrors.email}
            hint={!fieldErrors.email ? t('auth.emailHint') : undefined}
            required
            autoComplete="email"
          />
          <Input
            label={t('auth.phone')}
            type="tel"
            inputMode="numeric"
            placeholder="7X XXX XXX"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            onBlur={() => validateField('phone')}
            error={fieldErrors.phone}
            hint={!fieldErrors.phone ? t('auth.phoneHint') : undefined}
            required
            autoComplete="tel"
          />
          <PasswordInput
            label={t('auth.password')}
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            onBlur={() => validateField('password')}
            error={fieldErrors.password}
            hint={!fieldErrors.password ? t('auth.passwordHint') : undefined}
            required
            autoComplete="new-password"
          />
          <PasswordInput
            label={t('auth.confirmPassword')}
            value={form.confirmPassword}
            onChange={(e) => update('confirmPassword', e.target.value)}
            onBlur={() => validateField('confirmPassword')}
            error={fieldErrors.confirmPassword}
            hint={!fieldErrors.confirmPassword ? t('auth.confirmPasswordHint') : undefined}
            required
            autoComplete="new-password"
          />
          {form.role === 'student' && (
            <div>
              <UniversitySelect
                label={t('auth.yourUniversity')}
                value={form.universityId}
                onChange={(v) => update('universityId', v)}
                otherValue={form.customUniversity}
                onOtherChange={(v) => update('customUniversity', v)}
                required={false}
              />
              {form.universityId === 'other' && (
                <>
                  {fieldErrors.customUniversity && (
                    <p className="mt-1 text-xs text-error">{fieldErrors.customUniversity}</p>
                  )}
                  {!fieldErrors.customUniversity && (
                    <p className="mt-1.5 text-xs text-muted">{t('auth.universityHint')}</p>
                  )}
                </>
              )}
            </div>
          )}
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full" disabled={!authReady || loading || googleLoading || transitioning}>
            {loading ? t('auth.creating') : t('auth.createAccount')}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="font-semibold text-accent hover:underline">{t('auth.signIn')}</Link>
      </p>
      </motion.div>
    </>
  )
}
