import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Textarea } from '../ui/Input'
import { useTranslation } from '../../hooks/useTranslation'

export default function RequestChangesModal({ open, onClose, onConfirm, busy }) {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!message.trim()) return
    await onConfirm(message.trim())
    setMessage('')
  }

  function handleClose() {
    setMessage('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title={t('housing.requestChanges')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted">{t('housing.requestChangesHint')}</p>
        <Textarea
          label={t('housing.requestChangesMessage')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('housing.requestChangesPlaceholder')}
          required
          rows={4}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy || !message.trim()}>
            {busy ? t('housing.sending') : t('housing.sendChangeRequest')}
          </Button>
          <Button type="button" variant="outline" onClick={handleClose} disabled={busy}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
