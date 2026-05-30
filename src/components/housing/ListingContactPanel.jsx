import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, FileText, MessageCircle, Send, Loader2 } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { useAuth } from '../../hooks/useAuth'
import { useMessages } from '../../hooks/useHousing'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Input, { Textarea } from '../ui/Input'
import { getWhatsAppLink } from '../../lib/utils'
import { createViewingRequest, submitApplication, isLandlordVerified } from '../../lib/housing'
import ApplicationDocFields from './ApplicationDocFields'
import { APPLICATION_DOC_TYPES } from '../../lib/applicationDocs'

function WhatsAppIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function InlineChat({ conversationId, onClose }) {
  const { t } = useTranslation()
  const { messages, loading, send, userId } = useMessages(conversationId)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await send(text.trim())
      setText('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-72 flex-col rounded-lg border border-border bg-background">
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {loading && <p className="text-xs text-muted">{t('housing.chatLoading')}</p>}
        {!loading && messages.length === 0 && (
          <p className="text-xs text-muted">{t('housing.chatEmpty')}</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              msg.sender_id === userId
                ? 'ml-auto bg-accent text-primary'
                : 'bg-surface text-primary border border-border'
            }`}
          >
            {msg.body}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('housing.messagePlaceholder')}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <Button type="submit" size="sm" disabled={sending || !text.trim()}>
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </Button>
      </form>
    </div>
  )
}

export default function ListingContactPanel({ listing }) {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { startConversation } = useMessages(null)

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

  const landlordName = listing.landlord_display_name || listing.landlord?.full_name || 'Landlord'
  const landlordVerified = isLandlordVerified(listing)
  const isStudent = profile?.role === 'student'
  const canContact = listing.available && user && isStudent

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
    } catch (err) {
      setApplyError(err.message || t('housing.applicationFailed'))
    } finally {
      setApplyBusy(false)
    }
  }

  function closeApplyModal() {
    setApplyOpen(false)
    setApplyDone(false)
    setApplyDocs({})
    setApplyError('')
  }

  return (
    <>
      <div className="space-y-3">
        <div>
          <p className="text-sm text-muted">{t('listingDetail.listedBy')}</p>
          <p className="font-semibold">{landlordName}</p>
          {landlordVerified && (
            <p className="mt-1 text-xs font-semibold text-accent">{t('listings.verifiedLandlord')}</p>
          )}
        </div>

        {listing.is_verified && (
          <p className="text-xs font-medium text-accent">{t('listings.verifiedListing')}</p>
        )}

        {canContact && (
          <>
            <Button onClick={openChat} disabled={chatBusy} size="lg" className="w-full">
              {chatBusy ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
              {t('housing.chatInApp')}
            </Button>
            <Button variant="outline" onClick={() => requireAuth(() => setViewingOpen(true))} className="w-full">
              <Calendar size={18} />
              {t('housing.scheduleViewing')}
            </Button>
            <Button variant="outline" onClick={() => requireAuth(() => setApplyOpen(true))} className="w-full">
              <FileText size={18} />
              {t('housing.applyNow')}
            </Button>
          </>
        )}

        {listing.available && (
          <Button
            as="a"
            href={getWhatsAppLink(listing.whatsapp_number, listing.title)}
            target="_blank"
            rel="noopener noreferrer"
            variant="whatsapp"
            size="lg"
            className="w-full"
          >
            <WhatsAppIcon />
            {t('listings.chatWhatsApp')}
          </Button>
        )}

        <p className="text-xs text-muted text-center">{t('listingDetail.paymentNote')}</p>
      </div>

      <Modal open={chatOpen} onClose={() => setChatOpen(false)} title={t('housing.chatInApp')}>
        {conversationId && <InlineChat conversationId={conversationId} />}
      </Modal>

      <Modal open={viewingOpen} onClose={() => { setViewingOpen(false); setViewingDone(false) }} title={t('housing.scheduleViewing')}>
        {viewingDone ? (
          <p className="text-sm text-success">{t('housing.viewingSent')}</p>
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

      <Modal open={applyOpen} onClose={closeApplyModal} title={t('housing.applyNow')}>
        {applyDone ? (
          <p className="text-sm text-success">{t('housing.applicationSent')}</p>
        ) : (
          <form onSubmit={submitApply} className="space-y-4">
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
              {applyBusy ? t('housing.sending') : t('housing.submitApplication')}
            </Button>
          </form>
        )}
      </Modal>

      {listing.available && (
        <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-surface p-3 md:hidden">
          <div className="flex gap-2">
            {canContact ? (
              <>
                <Button onClick={openChat} disabled={chatBusy} size="sm" className="flex-1">
                  {chatBusy ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
                  {t('housing.chatInApp')}
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => requireAuth(() => setApplyOpen(true))}>
                  {t('housing.applyNow')}
                </Button>
              </>
            ) : null}
            <Button
              as="a"
              href={getWhatsAppLink(listing.whatsapp_number, listing.title)}
              target="_blank"
              rel="noopener noreferrer"
              variant="whatsapp"
              size="sm"
              className={canContact ? 'shrink-0 px-3' : 'flex-1'}
            >
              <WhatsAppIcon size={18} />
              {!canContact && t('listings.chatWhatsApp')}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
