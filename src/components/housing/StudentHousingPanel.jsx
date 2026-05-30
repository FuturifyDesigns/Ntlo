import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { useConversations, useStudentHousing } from '../../hooks/useHousing'
import { withdrawApplication, cancelViewingRequest } from '../../lib/housing'
import { getActiveRental } from '../../lib/applicationRules'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import ConversationChat from './ConversationChat'
import WithdrawReasonModal, { APPLICATION_WITHDRAW_REASONS, VIEWING_CANCEL_REASONS } from './WithdrawReasonModal'
import { chatOtherProfile } from '../../hooks/usePresence'

function statusVariant(status) {
  if (status === 'accepted' || status === 'rented' || status === 'confirmed') return 'success'
  if (status === 'rejected' || status === 'withdrawn' || status === 'declined' || status === 'cancelled') return 'error'
  if (status === 'changes_requested') return 'warning'
  return 'default'
}

function statusLabel(status, t) {
  return t(`housing.status.${status}`, { defaultValue: status.replace(/_/g, ' ') })
}

export default function StudentHousingPanel() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const { conversations, loading: convLoading } = useConversations()
  const { viewings, applications, loading, refetch } = useStudentHousing()
  const [tab, setTab] = useState('applications')
  const [activeChat, setActiveChat] = useState(null)
  const [activeChatLandlord, setActiveChatLandlord] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [initialLoad, setInitialLoad] = useState(true)
  const [withdrawAppId, setWithdrawAppId] = useState(null)
  const [cancelViewingId, setCancelViewingId] = useState(null)

  useEffect(() => {
    if (!loading && !convLoading) setInitialLoad(false)
  }, [loading, convLoading])

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (['applications', 'viewings', 'messages'].includes(tabParam)) setTab(tabParam)

    const chatId = searchParams.get('chat')
    if (!chatId || convLoading) return
    const match = conversations.find((c) => c.id === chatId)
    if (match) {
      setActiveChat(chatId)
      setActiveChatLandlord(chatOtherProfile(match, 'landlord'))
      setTab('messages')
    }
  }, [searchParams, conversations, convLoading])

  async function handleWithdraw({ reasonCode, reasonNote }) {
    if (!withdrawAppId) return
    setBusyId(withdrawAppId)
    try {
      await withdrawApplication(withdrawAppId, { reasonCode, reasonNote })
      setWithdrawAppId(null)
      refetch()
    } finally {
      setBusyId(null)
    }
  }

  async function handleCancelViewing({ reasonCode, reasonNote }) {
    if (!cancelViewingId) return
    setBusyId(cancelViewingId)
    try {
      await cancelViewingRequest(cancelViewingId, { reasonCode, reasonNote })
      setCancelViewingId(null)
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

  if (initialLoad && (loading || convLoading)) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-muted" />
      </div>
    )
  }

  return (
    <>
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
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
                <Badge variant={statusVariant(app.status)}>{statusLabel(app.status, t)}</Badge>
              </div>

              {app.status === 'changes_requested' && (
                <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <p className="text-sm font-medium text-primary">{t('housing.changesRequestedTitle')}</p>
                  {app.landlord_notes && <p className="text-sm text-muted">{app.landlord_notes}</p>}
                  <Button as={Link} to={`/listings/${app.listing_id}`} size="sm">
                    {t('housing.updateAndResubmit')}
                  </Button>
                </div>
              )}

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

              {['submitted', 'under_review', 'changes_requested'].includes(app.status) && (
                <Button size="sm" variant="outline" disabled={busyId === app.id} onClick={() => setWithdrawAppId(app.id)}>
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
            <Card key={vr.id} className="space-y-3 p-4">
              <div className="flex justify-between gap-2">
                <div>
                  <p className="font-semibold">{vr.listing?.title}</p>
                  {vr.preferred_at && (
                    <p className="text-sm text-muted">{new Date(vr.preferred_at).toLocaleString()}</p>
                  )}
                </div>
                <Badge variant={statusVariant(vr.status)}>{vr.status}</Badge>
              </div>
              {vr.status === 'pending' && (
                <Button size="sm" variant="outline" disabled={busyId === vr.id} onClick={() => setCancelViewingId(vr.id)}>
                  {t('housing.cancelViewing')}
                </Button>
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
              className="flex cursor-pointer items-center justify-between p-4"
              onClick={() => {
                setActiveChat(c.id)
                setActiveChatLandlord(chatOtherProfile(c, 'landlord'))
              }}
            >
              <div>
                <p className="font-semibold">{c.listing?.title}</p>
                <p className="text-sm text-muted">{c.landlord?.full_name || t('housing.landlord')}</p>
              </div>
              <Badge>{t('housing.openChat')}</Badge>
            </Card>
          ))}
        </div>
      )}

      <WithdrawReasonModal
        open={Boolean(withdrawAppId)}
        onClose={() => setWithdrawAppId(null)}
        onConfirm={handleWithdraw}
        title={t('housing.withdrawApplication')}
        reasons={APPLICATION_WITHDRAW_REASONS}
        busy={Boolean(withdrawAppId && busyId === withdrawAppId)}
      />
      <WithdrawReasonModal
        open={Boolean(cancelViewingId)}
        onClose={() => setCancelViewingId(null)}
        onConfirm={handleCancelViewing}
        title={t('housing.cancelViewing')}
        reasons={VIEWING_CANCEL_REASONS}
        busy={Boolean(cancelViewingId && busyId === cancelViewingId)}
      />

      <Modal open={Boolean(activeChat)} onClose={() => { setActiveChat(null); setActiveChatLandlord(null) }} title={t('housing.messages')}>
        {activeChat && (
          <ConversationChat conversationId={activeChat} otherProfile={activeChatLandlord} />
        )}
      </Modal>
    </div>
    </>
  )
}
