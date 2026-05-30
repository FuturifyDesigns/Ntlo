import { useState, useEffect, useRef } from 'react'
import { Loader2, Send } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { useMessages } from '../../hooks/useHousing'
import { useAuth } from '../../hooks/useAuth'
import { formatLastSeen, useProfilePresence } from '../../hooks/usePresence'
import Button from '../ui/Button'

export default function ConversationChat({
  conversationId,
  otherProfile,
  compact = false,
}) {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const { messages, loading, send, userId } = useMessages(conversationId)
  const { online, lastSeenAt } = useProfilePresence(otherProfile)
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
    const body = text.trim()
    setText('')
    try {
      await send(body)
    } catch {
      setText(body)
    } finally {
      setSending(false)
    }
  }

  const heightClass = compact ? 'h-72' : 'max-h-80 min-h-[16rem]'

  return (
    <div className="flex flex-col">
      {otherProfile && (
        <p className="mb-3 flex items-center gap-2 text-xs text-muted">
          <span className={`h-2 w-2 rounded-full ${online ? 'bg-success' : 'bg-border'}`} />
          {online ? t('presence.online') : formatLastSeen(lastSeenAt, t)}
        </p>
      )}
      <div className={`${heightClass} flex flex-col overflow-hidden rounded-lg border border-border bg-background`}>
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
            disabled={sending}
          />
          <Button type="submit" size="sm" disabled={sending || !text.trim()}>
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </Button>
        </form>
      </div>
    </div>
  )
}
