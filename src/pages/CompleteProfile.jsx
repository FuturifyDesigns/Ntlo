import { useState, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../hooks/useTranslation'
import { validatePhone, normalizeBotswanaPhone } from '../lib/authValidation'
import { validateFullUniversityName } from '../lib/universityNames'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import AuthTransitionOverlay from '../components/auth/AuthTransitionOverlay'
import { UniversitySelect } from '../components/universities/OtherUniversityModal'
import { getPostAuthPath } from '../lib/verification'
import { consumeOAuthNewSignup } from '../lib/oauthStorage'
import { getDraftKey } from '../lib/formDrafts'
import { useFormDraft } from '../hooks/useFormDraft'

export default function CompleteProfile() {
  const [searchParams] = useSearchParams()
  const defaultRole = searchParams.get('role') === 'landlord' ? 'landlord' : 'student'
  const { user, profile, refreshProfile } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [role, setRole] = useState(profile?.role || defaultRole)
  const [phone, setPhone] = useState(profile?.phone || '')
  const [universityId, setUniversityId] = useState(profile?.university_id ? String(profile.university_id) : '')
  const [customUniversity, setCustomUniversity] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [transitioning, setTransitioning] = useState(false)

  const draftKey = useMemo(() => getDraftKey('complete_profile', user?.id), [user?.id])

  const handleDraftRestore = useCallback((draft) => {
    if (draft.role) setRole(draft.role)
    if (draft.phone) setPhone(draft.phone)
    if (draft.universityId) setUniversityId(draft.universityId)
    if (draft.customUniversity) setCustomUniversity(draft.customUniversity)
  }, [])

  const handleDraftClear = useCallback(() => {
    setRole(profile?.role || defaultRole)
    setPhone(profile?.phone || '')
    setUniversityId(profile?.university_id ? String(profile.university_id) : '')
    setCustomUniversity('')
    setFieldErrors({})
    setError('')
  }, [profile, defaultRole])

  const { restored: draftRestored, savedLabel, clearDraft, dismissRestored } = useFormDraft(
    draftKey,
    { role, phone, universityId, customUniversity },
    handleDraftRestore,
    { enabled: Boolean(user?.id), onClear: handleDraftClear }
  )

  const validationMessages = {
    phoneRequired: t('auth.validation.phoneRequired'),
    phoneInvalid: t('auth.validation.phoneInvalid'),
    universityRequired: t('auth.validation.universityRequired'),
    universityMin: t('auth.validation.universityMin'),
    universityFullNameMin: t('auth.validation.universityFullNameMin'),
    universityFullNameRequired: t('auth.validation.universityFullNameRequired'),
    universityNoAbbrev: t('auth.validation.universityNoAbbrev'),
    authFailed: t('auth.validation.authFailed'),
  }

  function universityOtherError() {
    if (role !== 'student' || universityId !== 'other') return ''
    const key = validateFullUniversityName(customUniversity)
    return key ? t(`auth.validation.${key}`) : ''
  }

  function validateField(field) {
    const errors = {}
    const phoneError = validatePhone(phone, validationMessages, { required: true })
    if (phoneError) errors.phone = phoneError
    const uniError = universityOtherError()
    if (uniError) errors.customUniversity = uniError
    setFieldErrors((prev) => ({ ...prev, [field]: errors[field] || '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const errors = {}
    const phoneError = validatePhone(phone, validationMessages, { required: true })
    if (phoneError) errors.phone = phoneError
    const uniError = universityOtherError()
    if (uniError) errors.customUniversity = uniError
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setLoading(true)
    try {
      const normalizedPhone = normalizeBotswanaPhone(phone.trim())
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
      })

      if (profileError) throw profileError

      await supabase.auth.updateUser({
        data: {
          role,
          phone: normalizedPhone,
          full_name: updates.full_name,
        },
      })

      await refreshProfile()
      clearDraft()
      setTransitioning(true)

      if (consumeOAuthNewSignup()) {
        await supabase.auth.signOut()
        window.setTimeout(() => {
          navigate(`/check-email?oauth=1&email=${encodeURIComponent(user.email || '')}`, { replace: true })
        }, 350)
        return
      }

      const destination = getPostAuthPath({
        role,
        verification_status: role === 'landlord' ? 'none' : 'approved',
      })
      window.setTimeout(() => {
        navigate(destination, { replace: true })
      }, 350)
    } catch (err) {
      setError(err.message || validationMessages.authFailed)
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
          <Input
            label={t('auth.phone')}
            type="tel"
            inputMode="numeric"
            placeholder="7X XXX XXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => validateField('phone')}
            error={fieldErrors.phone}
            hint={!fieldErrors.phone ? t('auth.phoneHint') : undefined}
            required
            autoComplete="tel"
          />

          {role === 'student' && (
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
