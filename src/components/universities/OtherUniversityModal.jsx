import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { submitUniversityRequest } from '../../hooks/useStats'
import { UNIVERSITIES } from '../../lib/universities'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Modal from '../ui/Modal'

export default function OtherUniversityModal({ open, onClose }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await submitUniversityRequest({
        name,
        city,
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
    <Modal open={open} onClose={handleClose} title="Add your university" size="md">
      {done ? (
        <div className="py-4 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10"
          >
            <span className="text-2xl">✓</span>
          </motion.div>
          <p className="font-semibold text-primary">Request received</p>
          <p className="mt-2 text-sm text-muted">
            We&apos;ll review <strong>{name}</strong> in {city} and add it soon.
          </p>
          <Button className="mt-6 w-full" onClick={handleClose}>Done</Button>
        </div>
      ) : (
        <>
          <p className="mb-5 text-sm leading-relaxed text-muted">
            Don&apos;t see your university? Tell us the name and city and we&apos;ll add it to Ntlo.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="University name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="City / town" value={city} onChange={(e) => setCity(e.target.value)} required />
            {!user && (
              <Input label="Your email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            )}
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit request'}
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
}) {
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
        <option value="">Select university</option>
        {UNIVERSITIES.map((u) => (
          <option key={u.id} value={u.id}>{u.short_name} — {u.name}</option>
        ))}
        {allowOther && <option value="other">Other — not listed</option>}
      </select>
      {isOther && (
        <Input
          label="University name"
          value={otherValue}
          onChange={(e) => onOtherChange?.(e.target.value)}
          placeholder="Enter your university name"
          required
        />
      )}
    </div>
  )
}
