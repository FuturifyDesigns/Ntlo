import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { useConversations, useMessages, useStudentHousing } from '../../hooks/useHousing'
import { withdrawApplication } from '../../lib/housing'
import { getActiveRental } from '../../lib/applicationRules'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
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

function statusVariant(status) {
  if (status === 'accepted' || status === 'rented') return 'success'
  if (status === 'rejected' || status === 'withdrawn') return 'error'
  return 'default'
}

export default function StudentHousingPanel() {
  const { t } = useTranslation()
  const { conversations, loading: convLoading } = useConversations()
  const { viewings, applications, loading, refetch } = useStudentHousing()
  const [tab, setTab] = useState('applications')
  const [activeChat, setActiveChat] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function handleWithdraw(id) {
    setBusyId(id)
    try {
      await withdrawApplication(id)
      refetch()
    } finally {
      setBusyId(null)
    }
  }

  const activeRental = getActiveRental(applications)

  const tabs = [
    { id: 'applications', label: t('housing.applications'), count: applications.length },
    { id: 'viewings', label: t('housing.viewings'), count: viewings.length },
    { id: 'messages', label: t('housing.messages'), count: conversations.length },
  ]

  if (loading || convLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
          {activeRental && (
            <p className="rounded-lg border border-border bg-surface p-3 text-sm text-muted">
              {t('housing.currentlyRenting', { title: activeRental.listing?.title })}
            </p>
          )}
          {applications.length === 0 && <p className="text-sm text-muted">{t('housing.noApplicationsStudent')}</p>}
          {applications.map((app) => (
            <Card key={app.id} className="space-y-3 p-4">
              <div className="flex justify-between gap-2">
                <div>
                  <p className="font-semibold">{app.listing?.title}</p>
                  <p className="text-sm text-muted">{app.listing?.area}, {app.listing?.city}</p>
                  {app.move_in_date && (
                    <p className="mt-1 text-xs text-muted">{t('housing.moveInDate')}: {app.move_in_date}</p>
                  )}
                </div>
                <Badge variant={statusVariant(app.status)}>{app.status}</Badge>
              </div>

              {app.status === 'accepted' && (
                <p className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm text-muted">
                  {t('housing.studentAcceptedNote')}
                </p>
              )}

              {app.status === 'rented' && (
                <p className="text-sm font-medium text-success">{t('housing.studentRentedNote')}</p>
              )}

              {app.status === 'ended' && (
                <p className="text-sm text-muted">{t('housing.tenancyEndedStudent')}</p>
              )}

              {app.status === 'submitted' && (
                <Button size="sm" variant="outline" disabled={busyId === app.id} onClick={() => handleWithdraw(app.id)}>
                  {t('housing.withdrawApplication')}
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === 'viewings' && (
        <div className="space-y-3">
          {viewings.length === 0 && <p className="text-sm text-muted">{t('housing.noViewingsStudent')}</p>}
          {viewings.map((vr) => (
            <Card key={vr.id} className="p-4">
              <p className="font-semibold">{vr.listing?.title}</p>
              {vr.preferred_at && (
                <p className="text-sm text-muted">{new Date(vr.preferred_at).toLocaleString()}</p>
              )}
              <Badge className="mt-2">{vr.status}</Badge>
            </Card>
          ))}
        </div>
      )}

      {tab === 'messages' && (
        <div className="space-y-3">
          {conversations.length === 0 && <p className="text-sm text-muted">{t('housing.noMessages')}</p>}
          {conversations.map((c) => (
            <Card key={c.id} className="flex cursor-pointer items-center justify-between p-4" onClick={() => setActiveChat(c.id)}>
              <div>
                <p className="font-semibold">{c.listing?.title}</p>
                <p className="text-sm text-muted">{c.landlord?.full_name || t('housing.landlord')}</p>
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
