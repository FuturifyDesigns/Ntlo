import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, FileText, MessageCircle, Loader2 } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { useAuth } from '../../hooks/useAuth'
import { useMessages } from '../../hooks/useHousing'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Input, { Textarea } from '../ui/Input'
import { getWhatsAppLink } from '../../lib/utils'
import { createViewingRequest, submitApplication, mapHousingError, cancelViewingRequest, withdrawApplication } from '../../lib/housing'
import ConversationChat from './ConversationChat'
import WithdrawReasonModal, { APPLICATION_WITHDRAW_REASONS, VIEWING_CANCEL_REASONS } from './WithdrawReasonModal'
import ApplicationDocFields from './ApplicationDocFields'
import ApplicationRequirementsList from './ApplicationRequirementsList'
import { APPLICATION_DOC_TYPES } from '../../lib/applicationDocs'
import { canStudentApplyToListing, genderMatchesListing } from '../../lib/applicationRules'
import { isListingOpenForApply } from '../../lib/listingOccupancy'
import { useStudentHousing, useStudentListingStatus } from '../../hooks/useHousing'
import { GENDER_PREFERENCES } from '../../lib/utils'

function WhatsAppIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export default function ListingContactPanel({ listing, onboardingId }) {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { startConversation } = useMessages(null)
  const { applications: myApplications } = useStudentHousing()
  const { viewing: activeViewing, application: activeApplication, refetch: refetchStatus } = useStudentListingStatus(listing.id)

  const [chatOpen, setChatOpen] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const [chatBusy, setChatBusy] = useState(false)

  const [viewingOpen, setViewingOpen] = useState(false)
  const [viewingDate, setViewingDate] = useState('')
  const [viewingMessage, setViewingMessage] = useState('')
  const [viewingBusy, setViewingBusy] = useState(false)
  const [viewingDone, setViewingDone] = useState(false)

  const [applyOpen, setApplyOpen] = useState(false)
  const [moveInDate, setMoveInDate] = useState('')
  const [durationMonths, setDurationMonths] = useState('12')
  const [introMessage, setIntroMessage] = useState('')
  const [applyBusy, setApplyBusy] = useState(false)
  const [applyDone, setApplyDone] = useState(false)
  const [applyDocs, setApplyDocs] = useState({})
  const [applyError, setApplyError] = useState('')
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [cancelViewingOpen, setCancelViewingOpen] = useState(false)
  const [withdrawBusy, setWithdrawBusy] = useState(false)

  const landlordName = listing.landlord_display_name || listing.landlord?.full_name || 'Landlord'
  const isStudent = profile?.role === 'student'
  const isGuest = !user
  const genderRestricted = isStudent
    && profile?.gender
    && listing.gender_preference
    && listing.gender_preference !== 'any'
    && !genderMatchesListing(profile.gender, listing.gender_preference)
  const canContact = user && isStudent && !genderRestricted
    && (isListingOpenForApply(listing) || activeApplication?.status === 'changes_requested')
  const applyCheck = isStudent ? canStudentApplyToListing(profile, listing) : { ok: false }
  const currentlyRented = myApplications?.some((a) => a.status === 'rented')
  const applyBlockedReason = !applyCheck.ok ? applyCheck.reason : null

  function requireAuth(action) {
    if (!user) {
      navigate('/login')
      return false
    }
    if (!isStudent) return false
    return action()
  }

  async function openChat() {
    requireAuth(async () => {
      setChatBusy(true)
      try {
        const id = await startConversation(listing.id)
        setConversationId(id)
        setChatOpen(true)
      } finally {
        setChatBusy(false)
      }
    })
  }

  async function submitViewing(e) {
    e.preventDefault()
    setViewingBusy(true)
    try {
      await createViewingRequest({
        listingId: listing.id,
        landlordId: listing.landlord_id,
        preferredAt: viewingDate ? new Date(viewingDate).toISOString() : null,
        message: viewingMessage,
      })
      setViewingDone(true)
      refetchStatus()
    } catch (err) {
      const key = mapHousingError(err.message)
      setApplyError(t(`housing.errors.${key}`, { defaultValue: err.message }))
    } finally {
      setViewingBusy(false)
    }
  }

  async function submitApply(e) {
    e.preventDefault()
    setApplyError('')
    const missing = APPLICATION_DOC_TYPES.filter((d) => !applyDocs[d.id])
    if (missing.length) {
      setApplyError(t('housing.documentsRequired'))
      return
    }
    setApplyBusy(true)
    try {
      await submitApplication({
        listingId: listing.id,
        landlordId: listing.landlord_id,
        moveInDate: moveInDate || null,
        durationMonths,
        introMessage,
        documents: applyDocs,
      })
      setApplyDone(true)
      refetchStatus()
    } catch (err) {
      const key = mapHousingError(err.message)
      setApplyError(t(`housing.errors.${key}`, { defaultValue: err.message }))
    } finally {
      setApplyBusy(false)
    }
  }

  async function handleWithdrawApplication({ reasonCode, reasonNote }) {
    if (!activeApplication?.id) return
    setWithdrawBusy(true)
    try {
      await withdrawApplication(activeApplication.id, { reasonCode, reasonNote })
      refetchStatus()
      setApplyOpen(false)
      setApplyDone(false)
      setWithdrawOpen(false)
    } catch (err) {
      setApplyError(err.message)
    } finally {
      setWithdrawBusy(false)
    }
  }

  async function handleCancelViewing({ reasonCode, reasonNote }) {
    if (!activeViewing?.id) return
    setWithdrawBusy(true)
    try {
      await cancelViewingRequest(activeViewing.id, { reasonCode, reasonNote })
      refetchStatus()
      setCancelViewingOpen(false)
    } catch (err) {
      setApplyError(err.message)
    } finally {
      setWithdrawBusy(false)
    }
  }

  const viewingPending = activeViewing?.status === 'pending'
  const viewingConfirmed = activeViewing?.status === 'confirmed'
  const applicationPending = activeApplication && ['submitted', 'under_review'].includes(activeApplication.status)
  const applicationChangesRequested = activeApplication?.status === 'changes_requested'
  const applicationAccepted = activeApplication && ['accepted', 'rented'].includes(activeApplication.status)

  function tryOpenApply() {
    if (applicationChangesRequested) {
      setApplyError('')
      setApplyOpen(true)
      return
    }
    if (!applyCheck.ok) {
      if (applyCheck.reason === 'genderRequired') {
        navigate('/complete-profile')
        return
      }
      setApplyError(t(`housing.errors.${applyCheck.reason}`, {
        preference: applyCheck.preference ? GENDER_PREFERENCES[applyCheck.preference] : '',
      }))
      return
    }
    setApplyError('')
    setApplyOpen(true)
  }

  function closeApplyModal() {
    setApplyOpen(false)
    setApplyDone(false)
    setApplyDocs({})
    setApplyError('')
  }

  return (
    <>
      <div className="space-y-3" data-onboarding={onboardingId}>
        <div>
          <p className="text-sm text-muted">{t('listingDetail.listedBy')}</p>
          <p className="font-semibold">{landlordName}</p>
        </div>

        {listing.available && isGuest && (
          <div className="rounded-lg border border-border bg-background p-4 text-center">
            <p className="text-sm text-muted">{t('listingDetail.signInPrompt')}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button as={Link} to="/register" variant="outline" size="sm" className="w-full sm:w-auto">
                {t('auth.register')}
              </Button>
              <Button as={Link} to="/login" size="sm" className="w-full sm:w-auto">
                {t('auth.signIn')}
              </Button>
            </div>
          </div>
        )}

        {genderRestricted && (
          <div className="rounded-xl border border-border bg-background p-4 text-center">
            <p className="font-medium text-primary">{t('housing.genderRestrictionTitle')}</p>
            <p className="mt-2 text-sm text-muted">
              {listing.gender_preference === 'female'
                ? t('housing.genderRestrictionFemale')
                : t('housing.genderRestrictionMale')}
            </p>
            <p className="mt-3 text-xs text-muted">{t('housing.genderRestrictionHint')}</p>
          </div>
        )}

        {canContact && (
          <>
            <Button onClick={openChat} disabled={chatBusy} size="lg" className="w-full">
              {chatBusy ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
              {t('housing.chatInApp')}
            </Button>
            <Button variant="outline" onClick={() => requireAuth(() => setViewingOpen(true))} className="w-full" disabled={viewingPending || viewingConfirmed}>
              <Calendar size={18} />
              {viewingConfirmed
                ? t('housing.viewingConfirmed')
                : viewingPending
                  ? t('housing.viewingPending')
                  : t('housing.scheduleViewing')}
            </Button>
            {viewingPending && (
              <button type="button" onClick={() => setCancelViewingOpen(true)} className="w-full text-center text-xs text-muted underline hover:text-primary">
                {t('housing.cancelViewing')}
              </button>
            )}
            <Button variant="outline" onClick={() => requireAuth(tryOpenApply)} className="w-full" disabled={(applicationPending || applicationAccepted) && !applicationChangesRequested}>
              <FileText size={18} />
              {applicationAccepted
                ? t('housing.applicationAccepted')
                : applicationChangesRequested
                  ? t('housing.updateAndResubmit')
                  : applicationPending
                    ? t('housing.applicationPending')
                    : t('housing.applyNow')}
            </Button>
            {applicationChangesRequested && activeApplication?.landlord_notes && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-muted">
                <p className="font-medium text-primary">{t('housing.changesRequestedTitle')}</p>
                <p className="mt-1">{activeApplication.landlord_notes}</p>
              </div>
            )}
            {(applicationPending || applicationChangesRequested) && (
              <button type="button" onClick={() => setWithdrawOpen(true)} className="w-full text-center text-xs text-muted underline hover:text-primary">
                {t('housing.withdrawApplication')}
              </button>
            )}
            <p className="text-center text-xs text-muted">{t('housing.inAppPreferred')}</p>
            <Button
              as="a"
              href={getWhatsAppLink(listing.whatsapp_number, listing.title)}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              size="sm"
              className="w-full"
            >
              <WhatsAppIcon size={16} />
              {t('listings.chatWhatsAppOptional')}
            </Button>
            {applyBlockedReason === 'genderRequired' && (
              <p className="text-xs text-muted">
                {t('housing.errors.genderRequired')}{' '}
                <Link to="/complete-profile" className="font-medium text-accent underline">
                  {t('housing.completeProfileLink')}
                </Link>
              </p>
            )}
            {applyBlockedReason && applyBlockedReason !== 'genderRequired' && applyBlockedReason !== 'genderMismatch' && (
              <p className="text-xs text-error">{t(`housing.errors.${applyBlockedReason}`)}</p>
            )}
            {currentlyRented && applyCheck.ok && (
              <p className="text-xs text-muted">{t('housing.applyingWhileRented')}</p>
            )}
            {applyError && !applyOpen && <p className="text-xs text-error">{applyError}</p>}
          </>
        )}

        {canContact && (
          <p className="text-xs text-muted text-center">{t('listingDetail.paymentNote')}</p>
        )}
      </div>

      <Modal open={chatOpen} onClose={() => setChatOpen(false)} title={t('housing.chatInApp')}>
        {conversationId && (
          <ConversationChat
            conversationId={conversationId}
            otherProfile={{ id: listing.landlord_id, last_seen_at: listing.landlord?.last_seen_at }}
            compact
          />
        )}
      </Modal>

      <Modal open={viewingOpen} onClose={() => { setViewingOpen(false); setViewingDone(false) }} title={t('housing.scheduleViewing')}>
        {viewingDone || viewingPending ? (
          <div className="space-y-3">
            <p className="text-sm text-success">{t('housing.viewingSent')}</p>
            {viewingPending && (
              <Button variant="outline" size="sm" onClick={() => setCancelViewingOpen(true)}>{t('housing.cancelViewing')}</Button>
            )}
          </div>
        ) : (
          <form onSubmit={submitViewing} className="space-y-4">
            <Input
              label={t('housing.preferredDate')}
              type="datetime-local"
              value={viewingDate}
              onChange={(e) => setViewingDate(e.target.value)}
            />
            <Textarea
              label={t('housing.viewingMessage')}
              value={viewingMessage}
              onChange={(e) => setViewingMessage(e.target.value)}
              placeholder={t('housing.viewingMessagePlaceholder')}
            />
            <Button type="submit" disabled={viewingBusy} className="w-full">
              {viewingBusy ? t('housing.sending') : t('housing.sendRequest')}
            </Button>
          </form>
        )}
      </Modal>

      <Modal open={applyOpen} onClose={closeApplyModal} title={applicationChangesRequested ? t('housing.updateAndResubmit') : t('housing.applyNow')} size="lg">
        {applyDone || (applicationPending && !applicationChangesRequested) ? (
          <div className="space-y-3">
            <p className="text-sm text-success">{t('housing.applicationSent')}</p>
            {applicationPending && (
              <Button variant="outline" size="sm" onClick={() => setWithdrawOpen(true)}>{t('housing.withdrawApplication')}</Button>
            )}
          </div>
        ) : (
          <form onSubmit={submitApply} className="space-y-4">
            <ApplicationRequirementsList />
            <ApplicationDocFields files={applyDocs} onChange={setApplyDocs} disabled={applyBusy} />
            <Input
              label={t('housing.moveInDate')}
              type="date"
              value={moveInDate}
              onChange={(e) => setMoveInDate(e.target.value)}
              required
            />
            <Input
              label={t('housing.durationMonths')}
              type="number"
              min="1"
              max="24"
              value={durationMonths}
              onChange={(e) => setDurationMonths(e.target.value)}
              required
            />
            <Textarea
              label={t('housing.introMessage')}
              value={introMessage}
              onChange={(e) => setIntroMessage(e.target.value)}
              placeholder={t('housing.introPlaceholder')}
              required
            />
            {applyError && <p className="text-sm text-error">{applyError}</p>}
            <p className="text-xs text-muted">{t('housing.externalPaymentNote')}</p>
            <Button type="submit" disabled={applyBusy} className="w-full">
              {applyBusy ? t('housing.sending') : applicationChangesRequested ? t('housing.resubmitApplication') : t('housing.submitApplication')}
            </Button>
          </form>
        )}
      </Modal>

      <WithdrawReasonModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onConfirm={handleWithdrawApplication}
        title={t('housing.withdrawApplication')}
        reasons={APPLICATION_WITHDRAW_REASONS}
        busy={withdrawBusy}
      />
      <WithdrawReasonModal
        open={cancelViewingOpen}
        onClose={() => setCancelViewingOpen(false)}
        onConfirm={handleCancelViewing}
        title={t('housing.cancelViewing')}
        reasons={VIEWING_CANCEL_REASONS}
        busy={withdrawBusy}
      />

      {canContact && (
        <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-surface p-3 md:hidden">
          <div className="flex gap-2">
            <Button onClick={openChat} disabled={chatBusy} size="sm" className="flex-1">
              {chatBusy ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
              {t('housing.chatInApp')}
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => requireAuth(tryOpenApply)}>
              {t('housing.applyNow')}
            </Button>
            <Button
              as="a"
              href={getWhatsAppLink(listing.whatsapp_number, listing.title)}
              target="_blank"
              rel="noopener noreferrer"
              variant="whatsapp"
              size="sm"
              className="shrink-0 px-3"
            >
              <WhatsAppIcon size={18} />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
