import { useState } from 'react'
import { Calendar, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { useAuth } from '../../hooks/useAuth'
import { useLandlordInquiries, useMessages } from '../../hooks/useHousing'
import { respondToApplication, updateViewingRequest } from '../../lib/housing'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Input from '../ui/Input'
import Modal from '../ui/Modal'

function ConversationChatModal({ conversationId, open, onClose }) {
  const { t } = useTranslation()
  const { messages, loading, send, userId } = useMessages(conversationId)

  async function handleSubmit(e) {
    e.preventDefault()
    const form = e.target
    const input = form.elements.message
    if (!input.value.trim()) return
    await send(input.value.trim())
    input.value = ''
  }

  return (
    <Modal open={open} onClose={onClose} title={t('housing.messages')}>
      <div className="max-h-80 space-y-2 overflow-y-auto">
        {loading && <p className="text-xs text-muted">{t('housing.chatLoading')}</p>}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              msg.sender_id === userId ? 'ml-auto bg-accent text-primary' : 'border border-border bg-background'
            }`}
          >
            {msg.body}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input name="message" className="flex-1 rounded-lg border border-border px-3 py-2 text-sm" placeholder={t('housing.messagePlaceholder')} />
        <Button type="submit" size="sm">{t('housing.send')}</Button>
      </form>
    </Modal>
  )
}

export default function LandlordInquiriesPanel() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { viewings, applications, conversations, loading, refetch } = useLandlordInquiries()
  const [tab, setTab] = useState('applications')
  const [busyId, setBusyId] = useState(null)
  const [deposit, setDeposit] = useState('')
  const [activeChat, setActiveChat] = useState(null)

  async function handleViewing(id, status) {
    setBusyId(id)
    try {
      await updateViewingRequest(id, {
        status,
        confirmed_at: status === 'confirmed' ? new Date().toISOString() : null,
      })
      refetch()
    } finally {
      setBusyId(null)
    }
  }

  async function handleApplication(id, accept) {
    setBusyId(id)
    try {
      await respondToApplication(id, {
        accept,
        notes: accept ? t('housing.applicationAcceptedNote') : t('housing.applicationRejectedNote'),
        depositPula: accept && deposit ? Number(deposit) : null,
      })
      refetch()
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-muted" />
      </div>
    )
  }

  const tabs = [
    { id: 'applications', label: t('housing.applications'), count: applications.length },
    { id: 'viewings', label: t('housing.viewings'), count: viewings.length },
    { id: 'messages', label: t('housing.messages'), count: conversations.length },
  ]

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-primary">{t('housing.inquiriesTitle')}</h2>
      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
              tab === item.id ? 'border-accent bg-accent/10 text-primary' : 'border-border text-muted'
            }`}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      {tab === 'applications' && (
        <div className="space-y-3">
          {applications.length === 0 && <p className="text-sm text-muted">{t('housing.noApplications')}</p>}
          {applications.map((app) => (
            <Card key={app.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-primary">{app.listing?.title}</p>
                  <p className="text-sm text-muted">{app.student?.full_name || t('housing.student')}</p>
                  {app.move_in_date && (
                    <p className="text-xs text-muted">{t('housing.moveInDate')}: {app.move_in_date}</p>
                  )}
                  {app.intro_message && <p className="mt-2 text-sm text-muted">{app.intro_message}</p>}
                </div>
                <Badge variant={app.status === 'accepted' ? 'success' : app.status === 'rejected' ? 'error' : 'default'}>
                  {app.status}
                </Badge>
              </div>
              {app.status === 'submitted' && (
                <div className="flex flex-wrap gap-2">
                  <Input
                    type="number"
                    placeholder={t('housing.depositAmount')}
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    className="max-w-[140px]"
                  />
                  <Button size="sm" disabled={busyId === app.id} onClick={() => handleApplication(app.id, true)}>
                    <CheckCircle2 size={14} />
                    {t('housing.accept')}
                  </Button>
                  <Button size="sm" variant="outline" disabled={busyId === app.id} onClick={() => handleApplication(app.id, false)}>
                    <XCircle size={14} />
                    {t('housing.decline')}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === 'viewings' && (
        <div className="space-y-3">
          {viewings.length === 0 && <p className="text-sm text-muted">{t('housing.noViewings')}</p>}
          {viewings.map((vr) => (
            <Card key={vr.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-primary">{vr.listing?.title}</p>
                  <p className="text-sm text-muted">{vr.student?.full_name}</p>
                  {vr.preferred_at && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                      <Calendar size={12} />
                      {new Date(vr.preferred_at).toLocaleString()}
                    </p>
                  )}
                  {vr.message && <p className="mt-2 text-sm text-muted">{vr.message}</p>}
                </div>
                <Badge>{vr.status}</Badge>
              </div>
              {vr.status === 'pending' && (
                <div className="flex gap-2">
                  <Button size="sm" disabled={busyId === vr.id} onClick={() => handleViewing(vr.id, 'confirmed')}>
                    {t('housing.confirmViewing')}
                  </Button>
                  <Button size="sm" variant="outline" disabled={busyId === vr.id} onClick={() => handleViewing(vr.id, 'declined')}>
                    {t('housing.decline')}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === 'messages' && (
        <div className="space-y-3">
          {conversations.length === 0 && <p className="text-sm text-muted">{t('housing.noMessages')}</p>}
          {conversations.map((c) => (
            <Card
              key={c.id}
              className="flex cursor-pointer items-center justify-between p-4 transition hover:border-accent"
              onClick={() => setActiveChat(c.id)}
            >
              <div>
                <p className="font-semibold text-primary">{c.listing?.title}</p>
                <p className="text-sm text-muted">{c.student?.full_name}</p>
              </div>
              <Badge>{t('housing.openChat')}</Badge>
            </Card>
          ))}
        </div>
      )}

      <ConversationChatModal
        conversationId={activeChat}
        open={Boolean(activeChat)}
        onClose={() => setActiveChat(null)}
      />
    </div>
  )
}
