import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldAlert, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from '../../hooks/useTranslation'
import { supabase } from '../../lib/supabase'
import Button from '../ui/Button'
import { isBanActive, saveBanInfoForLogin, buildBanInfoFromProfile, formatBanEndsAt } from '../../lib/bans'

export default function BanEnforcementLayer() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const [busy, setBusy] = useState(false)

  const activeBan = user && profile && isBanActive(profile)
  const needsAcknowledgment = activeBan && !profile.ban_acknowledged_at

  useEffect(() => {
    if (!needsAcknowledgment || !user?.id) return
    supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('type', 'account_banned')
      .is('read_at', null)
      .then(() => {})
  }, [needsAcknowledgment, user?.id])

  if (!needsAcknowledgment) return null

  const endsAt = formatBanEndsAt(profile)
  const reasonKey = profile.ban_reason_code ? `admin.banReason.${profile.ban_reason_code}` : null

  async function handleConfirm() {
    setBusy(true)
    try {
      if (user?.id) {
        await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('type', 'account_banned')
          .is('read_at', null)
      }
      const { error } = await supabase.rpc('acknowledge_account_ban')
      if (error) throw error
      saveBanInfoForLogin(buildBanInfoFromProfile(profile))
      await signOut()
      navigate('/login', { replace: true })
    } catch {
      saveBanInfoForLogin(buildBanInfoFromProfile(profile))
      await signOut().catch(() => {})
      navigate('/login', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-primary/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-error/30 bg-surface p-6 shadow-2xl"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-error/10 text-error">
          <ShieldAlert size={24} />
        </div>
        <h2 className="font-display text-xl font-semibold text-primary">{t('ban.suspendedTitle')}</h2>
        <p className="mt-2 text-sm text-muted">{t('ban.suspendedIntro')}</p>

        <div className="mt-4 space-y-2 rounded-xl border border-border bg-background px-4 py-3 text-sm">
          {reasonKey && (
            <p><span className="font-medium text-primary">{t('ban.reason')}:</span> {t(reasonKey)}</p>
          )}
          {profile.ban_reason_note && (
            <p className="text-muted">{profile.ban_reason_note}</p>
          )}
          {!reasonKey && profile.banned_reason && (
            <p className="whitespace-pre-wrap text-muted">{profile.banned_reason}</p>
          )}
          <p>
            <span className="font-medium text-primary">{t('ban.duration')}:</span>{' '}
            {profile.banned_until
              ? t('ban.until', { date: endsAt?.toLocaleString() || profile.banned_until })
              : t('ban.permanent')}
          </p>
        </div>

        <p className="mt-4 text-xs text-muted">{t('ban.confirmHint')}</p>

        <Button type="button" className="mt-6 w-full" onClick={handleConfirm} disabled={busy}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : null}
          {t('ban.confirmButton')}
        </Button>
      </motion.div>
    </div>
  )
}
