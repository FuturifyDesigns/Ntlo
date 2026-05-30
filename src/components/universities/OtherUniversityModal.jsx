import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { submitUniversityRequest } from '../../hooks/useStats'
import { useUniversities } from '../../hooks/useUniversities'
import { useTranslation } from '../../hooks/useTranslation'
import { getUniversityDisplayName, validateFullUniversityName } from '../../lib/universityNames'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Modal from '../ui/Modal'

export default function OtherUniversityModal({ open, onClose }) {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const nameErrorKey = validateFullUniversityName(name)
    if (nameErrorKey) {
      setError(t(`auth.validation.${nameErrorKey}`))
      return
    }
    setLoading(true)
    try {
      await submitUniversityRequest({
        name: name.trim(),
        city: city.trim(),
        userId: user?.id,
        email: email || user?.email,
      })
      setDone(true)
    } catch (err) {
      setError(err.message || 'Could not submit request. Try again later.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setName('')
    setCity('')
    setEmail('')
    setDone(false)
    setError('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title={t('universities.otherUniversity')} size="md">
      {done ? (
        <div className="py-4 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10"
          >
            <span className="text-2xl">✓</span>
          </motion.div>
          <p className="font-semibold text-primary">{t('universities.requestReceived')}</p>
          <p className="mt-2 text-sm text-muted">
            {t('universities.requestReview', { name, city })}
          </p>
          <Button className="mt-6 w-full" onClick={handleClose}>{t('common.done')}</Button>
        </div>
      ) : (
        <>
          <p className="mb-5 text-sm leading-relaxed text-muted">
            {t('universities.otherFullNameHint')}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('universities.fullUniversityName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('universities.fullUniversityNamePlaceholder')}
              required
            />
            <Input
              label={t('universities.cityTown')}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t('universities.cityTownPlaceholder')}
              required
            />
            {!user && (
              <Input label={t('universities.yourEmailOptional')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            )}
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>{t('common.cancel')}</Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? t('universities.submitting') : t('universities.submitRequest')}
              </Button>
            </div>
          </form>
        </>
      )}
    </Modal>
  )
}

export function UniversitySelect({
  value,
  onChange,
  label = 'Nearest university',
  required,
  allowOther = true,
  otherValue = '',
  onOtherChange,
  otherCityValue = '',
  onOtherCityChange,
}) {
  const { universities } = useUniversities()
  const { t } = useTranslation()
  const isOther = value === 'other'

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-primary">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={required && !isOther}
        className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
      >
        <option value="">{t('universities.selectUniversity')}</option>
        {universities.map((u) => (
          <option key={u.id} value={u.id}>{getUniversityDisplayName(u)} — {u.city}</option>
        ))}
        {allowOther && <option value="other">{t('filter.otherUniversity')}</option>}
      </select>
      {isOther && (
        <>
          <Input
            label={t('universities.fullUniversityName')}
            value={otherValue}
            onChange={(e) => onOtherChange?.(e.target.value)}
            placeholder={t('universities.fullUniversityNamePlaceholder')}
            required
          />
          <Input
            label={t('universities.universityCity')}
            value={otherCityValue}
            onChange={(e) => onOtherCityChange?.(e.target.value)}
            placeholder={t('universities.universityCityPlaceholder')}
            required
          />
          <p className="text-xs text-muted">{t('universities.otherFullNameHint')}</p>
        </>
      )}
    </div>
  )
}
