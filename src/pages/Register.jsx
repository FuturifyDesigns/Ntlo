import { useState, useCallback, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useGoogleAuth } from '../hooks/useGoogleAuth'
import { submitUniversityRequest } from '../hooks/useStats'
import { useTranslation } from '../hooks/useTranslation'
import { validateRegisterForm, mapAuthError, normalizePhone } from '../lib/authValidation'
import { checkPhoneAvailable } from '../lib/phoneAvailability'
import { splitStoredPhone } from '../lib/phoneNumbers'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import PhoneInput from '../components/ui/PhoneInput'
import PasswordInput from '../components/ui/PasswordInput'
import GoogleAuthButton from '../components/auth/GoogleAuthButton'
import AuthTransitionOverlay from '../components/auth/AuthTransitionOverlay'
import { UniversitySelect } from '../components/universities/OtherUniversityModal'
import GenderSelect from '../components/auth/GenderSelect'
import { supabase } from '../lib/supabase'
import { abandonIncompleteSignup } from '../lib/abandonSignup'
import { getPostAuthPath } from '../lib/verification'
import { getDraftKey } from '../lib/formDrafts'
import { useFormDraft } from '../hooks/useFormDraft'

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
    phoneCountryCode: '267',
    phoneNational: '',
    role: defaultRole,
    universityId: '',
    customUniversity: '',
    gender: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const draftKey = useMemo(() => getDraftKey('register'), [])

  const handleDraftRestore = useCallback((draft) => {
    if (draft.form) {
      setForm((prev) => ({
        ...prev,
        fullName: draft.form.fullName ?? prev.fullName,
        email: draft.form.email ?? prev.email,
        phone: draft.form.phone ?? prev.phone,
        phoneCountryCode: draft.form.phoneCountryCode ?? splitStoredPhone(draft.form.phone).countryCode ?? prev.phoneCountryCode,
        phoneNational: draft.form.phoneNational ?? splitStoredPhone(draft.form.phone).national ?? prev.phoneNational,
        role: draft.form.role ?? prev.role,
        universityId: draft.form.universityId ?? prev.universityId,
        customUniversity: draft.form.customUniversity ?? prev.customUniversity,
        gender: draft.form.gender ?? prev.gender,
      }))
    }
  }, [])

  const handleDraftClear = useCallback(() => {
    setForm({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      phoneCountryCode: '267',
      phoneNational: '',
      role: defaultRole,
      universityId: '',
      customUniversity: '',
      gender: '',
    })
    setFieldErrors({})
    setError('')
  }, [defaultRole])

  const draftPayload = useMemo(() => ({
    form: {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      phoneCountryCode: form.phoneCountryCode,
      phoneNational: form.phoneNational,
      role: form.role,
      universityId: form.universityId,
      customUniversity: form.customUniversity,
      gender: form.gender,
    },
  }), [form.fullName, form.email, form.phone, form.phoneCountryCode, form.phoneNational, form.role, form.universityId, form.customUniversity, form.gender])

  const { restored: draftRestored, savedLabel, clearDraft, dismissRestored } = useFormDraft(
    draftKey,
    draftPayload,
    handleDraftRestore,
    { onClear: handleDraftClear }
  )

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
    phoneTaken: t('auth.validation.phoneTaken'),
    universityRequired: t('auth.validation.universityRequired'),
    universityMin: t('auth.validation.universityMin'),
    universityFullNameMin: t('auth.validation.universityFullNameMin'),
    universityFullNameRequired: t('auth.validation.universityFullNameRequired'),
    universityNoAbbrev: t('auth.validation.universityNoAbbrev'),
    genderRequired: t('auth.validation.genderRequired'),
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

  async function validatePhoneField() {
    const errors = validateRegisterForm(form, validationMessages)
    setFieldErrors((prev) => ({ ...prev, phone: errors.phone || '' }))
    if (errors.phone) return

    const normalizedPhone = normalizePhone(form.phoneCountryCode, form.phoneNational)
    if (!normalizedPhone) return

    try {
      const available = await checkPhoneAvailable(normalizedPhone)
      if (!available) {
        setFieldErrors((prev) => ({ ...prev, phone: validationMessages.phoneTaken }))
      }
    } catch {
      // ignore availability check errors on blur
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const errors = validateRegisterForm(form, validationMessages)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const normalizedPhone = normalizePhone(form.phoneCountryCode, form.phoneNational)
    if (!normalizedPhone) {
      setFieldErrors((prev) => ({ ...prev, phone: validationMessages.phoneInvalid }))
      return
    }

    try {
      const available = await checkPhoneAvailable(normalizedPhone)
      if (!available) {
        setFieldErrors((prev) => ({ ...prev, phone: validationMessages.phoneTaken }))
        return
      }
    } catch (err) {
      setError(err.message || validationMessages.authFailed)
      return
    }

    setLoading(true)
    let createdUserId = null
    try {
      const data = await signUp({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        role: form.role,
        phone: normalizedPhone,
      })
      createdUserId = data.user?.id ?? null

      if (createdUserId && form.role === 'student' && form.gender) {
        const profileUpdates = { gender: form.gender }
        if (form.universityId && form.universityId !== 'other') {
          profileUpdates.university_id = Number(form.universityId)
        }
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', createdUserId)
        if (profileError) throw profileError
      }

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
        clearDraft()
        navigate('/check-email', { state: { email: form.email.trim() } })
        return
      }

      if (data.user && !data.user.email_confirmed_at && !data.user.confirmed_at) {
        clearDraft()
        navigate('/check-email', { state: { email: form.email.trim() } })
        return
      }

      clearDraft()
      navigate(getPostAuthPath({ role: form.role, verification_status: form.role === 'landlord' ? 'none' : 'approved' }))
    } catch (err) {
      if (createdUserId) {
        await abandonIncompleteSignup()
      }
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
        {(draftRestored || savedLabel) && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-primary">
            <span>
              {draftRestored
                ? t('auth.draftRestored')
                : t('auth.draftSaved', { time: savedLabel })}
            </span>
            <div className="flex gap-2">
              {draftRestored && (
                <button type="button" onClick={dismissRestored} className="font-semibold text-accent hover:underline">
                  {t('auth.draftDismiss')}
                </button>
              )}
              <button type="button" onClick={clearDraft} className="font-semibold text-muted hover:text-error">
                {t('auth.draftClear')}
              </button>
            </div>
          </div>
        )}
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
          <PhoneInput
            label={t('auth.phone')}
            countryCode={form.phoneCountryCode}
            national={form.phoneNational}
            onCountryCodeChange={(code) => update('phoneCountryCode', code)}
            onNationalChange={(value) => update('phoneNational', value)}
            onBlur={validatePhoneField}
            error={fieldErrors.phone}
            hint={!fieldErrors.phone ? t('auth.phoneHint') : undefined}
            required
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
            <>
              <GenderSelect
                value={form.gender}
                onChange={(v) => update('gender', v)}
                error={fieldErrors.gender}
              />
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
            </>
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
