import { useState, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../hooks/useTranslation'
import { validatePhone, normalizePhone, mapAuthError } from '../lib/authValidation'
import { checkPhoneAvailable } from '../lib/phoneAvailability'
import { splitStoredPhone } from '../lib/phoneNumbers'
import { validateFullUniversityName } from '../lib/universityNames'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'
import PhoneInput from '../components/ui/PhoneInput'
import AuthTransitionOverlay from '../components/auth/AuthTransitionOverlay'
import { UniversitySelect } from '../components/universities/OtherUniversityModal'
import GenderSelect from '../components/auth/GenderSelect'
import { getPostAuthPath } from '../lib/verification'
import { clearOAuthStorage, profileNeedsSetup } from '../lib/oauthStorage'
import { getDraftKey } from '../lib/formDrafts'
import { useFormDraft } from '../hooks/useFormDraft'

export default function CompleteProfile() {
  const [searchParams] = useSearchParams()
  const defaultRole = searchParams.get('role') === 'landlord' ? 'landlord' : 'student'
  const { user, profile, refreshProfile } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const initialPhone = splitStoredPhone(profile?.phone || '')
  const [role, setRole] = useState(profile?.role || defaultRole)
  const [phoneCountryCode, setPhoneCountryCode] = useState(initialPhone.countryCode)
  const [phoneNational, setPhoneNational] = useState(initialPhone.national)
  const [universityId, setUniversityId] = useState(profile?.university_id ? String(profile.university_id) : '')
  const [customUniversity, setCustomUniversity] = useState('')
  const [gender, setGender] = useState(profile?.gender || '')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [transitioning, setTransitioning] = useState(false)

  const draftKey = useMemo(() => getDraftKey('complete_profile', user?.id), [user?.id])

  const handleDraftRestore = useCallback((draft) => {
    if (draft.role) setRole(draft.role)
    if (draft.phoneCountryCode) setPhoneCountryCode(draft.phoneCountryCode)
    if (draft.phoneNational) setPhoneNational(draft.phoneNational)
    else if (draft.phone) {
      const split = splitStoredPhone(draft.phone)
      setPhoneCountryCode(split.countryCode)
      setPhoneNational(split.national)
    }
    if (draft.universityId) setUniversityId(draft.universityId)
    if (draft.customUniversity) setCustomUniversity(draft.customUniversity)
    if (draft.gender) setGender(draft.gender)
  }, [])

  const handleDraftClear = useCallback(() => {
    setRole(profile?.role || defaultRole)
    const split = splitStoredPhone(profile?.phone || '')
    setPhoneCountryCode(split.countryCode)
    setPhoneNational(split.national)
    setUniversityId(profile?.university_id ? String(profile.university_id) : '')
    setCustomUniversity('')
    setGender(profile?.gender || '')
    setFieldErrors({})
    setError('')
  }, [profile, defaultRole])

  const { restored: draftRestored, savedLabel, clearDraft, dismissRestored } = useFormDraft(
    draftKey,
    { role, phoneCountryCode, phoneNational, universityId, customUniversity, gender },
    handleDraftRestore,
    { enabled: Boolean(user?.id), onClear: handleDraftClear }
  )

  const validationMessages = {
    phoneRequired: t('auth.validation.phoneRequired'),
    phoneInvalid: t('auth.validation.phoneInvalid'),
    phoneTaken: t('auth.validation.phoneTaken'),
    universityRequired: t('auth.validation.universityRequired'),
    universityMin: t('auth.validation.universityMin'),
    universityFullNameMin: t('auth.validation.universityFullNameMin'),
    universityFullNameRequired: t('auth.validation.universityFullNameRequired'),
    universityNoAbbrev: t('auth.validation.universityNoAbbrev'),
    genderRequired: t('auth.validation.genderRequired'),
    authFailed: t('auth.validation.authFailed'),
  }

  function universityOtherError() {
    if (role !== 'student' || universityId !== 'other') return ''
    const key = validateFullUniversityName(customUniversity)
    return key ? t(`auth.validation.${key}`) : ''
  }

  function validateField(field) {
    const errors = {}
    const phoneError = validatePhone(phoneNational, validationMessages, {
      required: true,
      countryCode: phoneCountryCode,
    })
    if (phoneError) errors.phone = phoneError
    const uniError = universityOtherError()
    if (uniError) errors.customUniversity = uniError
    setFieldErrors((prev) => ({ ...prev, [field]: errors[field] || '' }))
  }

  async function validatePhoneAvailability() {
    const phoneError = validatePhone(phoneNational, validationMessages, {
      required: true,
      countryCode: phoneCountryCode,
    })
    if (phoneError) return

    const normalizedPhone = normalizePhone(phoneCountryCode, phoneNational)
    if (!normalizedPhone) return

    try {
      const available = await checkPhoneAvailable(normalizedPhone, user?.id)
      if (!available) {
        setFieldErrors((prev) => ({ ...prev, phone: validationMessages.phoneTaken }))
      }
    } catch {
      // ignore on blur
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const errors = {}
    const phoneError = validatePhone(phoneNational, validationMessages, {
      required: true,
      countryCode: phoneCountryCode,
    })
    if (phoneError) errors.phone = phoneError
    const uniError = universityOtherError()
    if (uniError) errors.customUniversity = uniError
    if (role === 'student' && !gender) errors.gender = validationMessages.genderRequired
    if (!acceptedTerms) errors.acceptedTerms = t('auth.acceptTermsRequired')
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const normalizedPhone = normalizePhone(phoneCountryCode, phoneNational)
    if (!normalizedPhone) {
      setFieldErrors((prev) => ({ ...prev, phone: validationMessages.phoneInvalid }))
      return
    }

    try {
      const available = await checkPhoneAvailable(normalizedPhone, user?.id)
      if (!available) {
        setFieldErrors((prev) => ({ ...prev, phone: validationMessages.phoneTaken }))
        return
      }
    } catch (err) {
      setError(err.message || validationMessages.authFailed)
      return
    }

    setLoading(true)
    try {
      const updates = {
        phone: normalizedPhone,
        role,
        full_name: profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
      }

      if (role === 'student' && universityId && universityId !== 'other') {
        updates.university_id = Number(universityId)
      }

      const { error: profileError } = await supabase.rpc('complete_own_profile', {
        p_phone: normalizedPhone,
        p_role: role,
        p_full_name: updates.full_name,
        p_university_id: role === 'student' && universityId && universityId !== 'other'
          ? Number(universityId)
          : null,
        p_gender: role === 'student' ? gender : null,
      })

      if (profileError) throw profileError

      await supabase.auth.updateUser({
        data: {
          role,
          phone: normalizedPhone,
          full_name: updates.full_name,
        },
      })

      clearDraft()
      clearOAuthStorage()
      setTransitioning(true)

      const updated = await refreshProfile()
      if (!updated || profileNeedsSetup(updated)) {
        setError(t('auth.profileSaveFailed'))
        setTransitioning(false)
        setLoading(false)
        return
      }

      const destination = getPostAuthPath(updated)
      navigate(destination, { replace: true })
    } catch (err) {
      setError(mapAuthError(err.message, validationMessages))
      setLoading(false)
    }
  }

  return (
    <>
      <AuthTransitionOverlay show={transitioning} message={t('auth.signingInSmooth')} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mx-auto max-w-md px-4 py-8 sm:py-10"
      >
        <div className="text-center">
          <img
            src={`${import.meta.env.BASE_URL}logo-brand.png`}
            alt="Ntlo"
            className="mx-auto mb-4 h-16 w-auto max-w-[220px]"
          />
          <h1 className="font-display text-3xl font-semibold tracking-tight text-primary">
            {t('auth.completeProfileTitle')}
          </h1>
          <p className="mt-2 text-muted">{t('auth.completeProfileSubtitle')}</p>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`flex-1 rounded-lg border py-3 text-sm font-semibold transition-colors ${
              role === 'student'
                ? 'border-accent bg-accent/15 text-primary'
                : 'border-border text-muted hover:border-accent/50'
            }`}
          >
            {t('auth.lookingForRoom')}
          </button>
          <button
            type="button"
            onClick={() => setRole('landlord')}
            className={`flex-1 rounded-lg border py-3 text-sm font-semibold transition-colors ${
              role === 'landlord'
                ? 'border-accent bg-accent/15 text-primary'
                : 'border-border text-muted hover:border-accent/50'
            }`}
          >
            {t('auth.haveRoom')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm" noValidate>
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
          <PhoneInput
            label={t('auth.phone')}
            countryCode={phoneCountryCode}
            national={phoneNational}
            onCountryCodeChange={setPhoneCountryCode}
            onNationalChange={setPhoneNational}
            onBlur={validatePhoneAvailability}
            error={fieldErrors.phone}
            hint={!fieldErrors.phone ? t('auth.phoneHint') : undefined}
            required
          />

          {role === 'student' && (
            <>
              <GenderSelect
                value={gender}
                onChange={setGender}
                error={fieldErrors.gender}
              />
              <div>
                <UniversitySelect
                label={t('auth.yourUniversity')}
                value={universityId}
                onChange={setUniversityId}
                otherValue={customUniversity}
                onOtherChange={setCustomUniversity}
                required={false}
              />
              {fieldErrors.customUniversity && (
                <p className="mt-1 text-xs text-error">{fieldErrors.customUniversity}</p>
              )}
            </div>
            </>
          )}

          <label className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked)
                if (fieldErrors.acceptedTerms) {
                  setFieldErrors((prev) => ({ ...prev, acceptedTerms: '' }))
                }
              }}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-accent focus:ring-accent"
            />
            <span>
              {t('auth.acceptTermsPrefix')}{' '}
              <Link to="/terms" className="font-semibold text-accent hover:underline">
                {t('footer.terms')}
              </Link>{' '}
              {t('auth.acceptTermsAnd')}{' '}
              <Link to="/privacy" className="font-semibold text-accent hover:underline">
                {t('footer.privacy')}
              </Link>
              .
            </span>
          </label>
          {fieldErrors.acceptedTerms && (
            <p className="text-xs text-error">{fieldErrors.acceptedTerms}</p>
          )}

          {error && <p className="text-sm text-error">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading || transitioning}>
            {loading ? t('auth.savingProfile') : t('auth.continueToNtlo')}
          </Button>
        </form>
      </motion.div>
    </>
  )
}
