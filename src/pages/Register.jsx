import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { submitUniversityRequest } from '../hooks/useStats'
import { useTranslation } from '../hooks/useTranslation'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import GoogleAuthButton from '../components/auth/GoogleAuthButton'
import { UniversitySelect } from '../components/universities/OtherUniversityModal'

export default function Register() {
  const [searchParams] = useSearchParams()
  const defaultRole = searchParams.get('role') === 'landlord' ? 'landlord' : 'student'
  const { t } = useTranslation()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: defaultRole,
    universityId: '',
    customUniversity: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await signUp({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        role: form.role,
        phone: form.phone,
      })

      if (form.role === 'student' && form.universityId === 'other' && form.customUniversity.trim()) {
        try {
          await submitUniversityRequest({
            name: form.customUniversity.trim(),
            city: 'Botswana',
            email: form.email,
          })
        } catch {
          // Non-blocking
        }
      }

      if (data.user && !data.session) {
        navigate('/check-email', { state: { email: form.email } })
        return
      }

      navigate(form.role === 'landlord' ? '/landlord' : '/student')
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignUp() {
    setError('')
    setGoogleLoading(true)
    try {
      await signInWithGoogle({ role: form.role })
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
          onClick={handleGoogleSignUp}
          loading={googleLoading}
          disabled={loading}
          label={t('auth.signUpWithGoogle')}
        />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted">{t('auth.orEmail')}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('auth.fullName')} value={form.fullName} onChange={(e) => update('fullName', e.target.value)} required />
          <Input label={t('auth.email')} type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          <Input label={t('auth.phone')} type="tel" placeholder="7X XXX XXX" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          <Input label={t('auth.password')} type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={6} />
          {form.role === 'student' && (
            <UniversitySelect
              label={t('auth.yourUniversity')}
              value={form.universityId}
              onChange={(v) => update('universityId', v)}
              otherValue={form.customUniversity}
              onOtherChange={(v) => update('customUniversity', v)}
              required={false}
            />
          )}
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || googleLoading}>
            {loading ? t('auth.creating') : t('auth.createAccount')}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="font-semibold text-accent hover:underline">{t('auth.signIn')}</Link>
      </p>
    </motion.div>
  )
}
