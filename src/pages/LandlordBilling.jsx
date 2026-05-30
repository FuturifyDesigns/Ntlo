import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CreditCard,
  Clock,
  Check,
  Upload,
  AlertCircle,
  Gift,
  ChevronRight,
  FileText,
  Calendar,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../hooks/useTranslation'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { supabase } from '../lib/supabase'
import {
  BILLING_LIVE,
  LANDLORD_TIERS,
  FNB_PAYMENT,
  tierNameKey,
  formatTierLabel,
  subscriptionStatusLabel,
  daysUntilRenewal,
  needsRenewalSoon,
} from '../lib/subscriptions'
import { fetchUserPaymentReceipts, uploadPaymentReceipt, getReceiptSignedUrl } from '../lib/paymentReceipts'

export default function LandlordBilling() {
  const { user, profile } = useAuth()
  const { t } = useTranslation()
  const [selectedTier, setSelectedTier] = useState('standard')
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const loadReceipts = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const data = await fetchUserPaymentReceipts(user.id)
      setReceipts(data)
    } catch {
      setReceipts([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadReceipts()
  }, [loadReceipts])

  useEffect(() => {
    if (!user?.id) return undefined

    const channel = supabase
      .channel(`billing-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment_receipts', filter: `user_id=eq.${user.id}` },
        () => loadReceipts()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id, loadReceipts])

  async function handleReceiptUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !user?.id || !BILLING_LIVE) return
    setUploading(true)
    setUploadError('')
    setUploadSuccess(false)
    try {
      await uploadPaymentReceipt({ userId: user.id, tier: selectedTier, file })
      setUploadSuccess(true)
      e.target.value = ''
      await loadReceipts()
    } catch (err) {
      setUploadError(err.message || t('billing.uploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  async function openReceipt(path) {
    try {
      const url = await getReceiptSignedUrl(path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      setUploadError(t('billing.receiptOpenFailed'))
    }
  }

  const renewalDays = daysUntilRenewal(profile?.subscription_period_end)
  const showRenewalReminder = needsRenewalSoon(profile) || (renewalDays != null && renewalDays < 0)
  const status = profile?.subscription_status || 'early_access'
  const tierLabel = formatTierLabel(profile?.subscription_tier, t)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8"
    >
      <div className="mb-8">
        <Link to="/landlord" className="text-sm font-medium text-accent hover:underline">
          ← {t('billing.backToDashboard')}
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold text-primary">{t('billing.title')}</h1>
        <p className="mt-2 text-muted">{t('billing.subtitle')}</p>
      </div>

      {/* Early access hero */}
      <Card className="mb-6 overflow-hidden border-accent/30 bg-gradient-to-br from-accent/10 to-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent">
            <Gift size={24} />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-bold text-primary">{t('billing.earlyAccessTitle')}</h2>
              {!BILLING_LIVE && (
                <Badge variant="accent">{t('pricing.comingSoon')}</Badge>
              )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t('billing.earlyAccessBody')}</p>
          </div>
        </div>
      </Card>

      {/* Current status */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm text-muted">{t('billing.currentPlan')}</p>
          <p className="mt-1 font-display text-2xl font-bold text-primary">{tierLabel}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm">
            <span className={`h-2 w-2 rounded-full ${
              status === 'active' ? 'bg-success' : status === 'pending_payment' ? 'bg-warning' : 'bg-accent'
            }`} />
            {subscriptionStatusLabel(status, t)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <Calendar size={14} />
            {t('billing.nextCharge')}
          </p>
          {status === 'early_access' || !profile?.subscription_period_end ? (
            <p className="mt-1 font-display text-lg font-semibold text-primary">{t('billing.noChargeYet')}</p>
          ) : (
            <>
              <p className="mt-1 font-display text-lg font-semibold text-primary">
                {new Date(profile.subscription_period_end).toLocaleDateString()}
              </p>
              {renewalDays != null && renewalDays >= 0 && (
                <p className="mt-1 text-sm text-muted">
                  {t('billing.daysUntilRenewal', { days: renewalDays })}
                </p>
              )}
            </>
          )}
        </Card>
      </div>

      {showRenewalReminder && profile?.subscription_period_end && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
          <AlertCircle className="mt-0.5 shrink-0 text-warning" size={20} />
          <div>
            <p className="font-semibold text-primary">{t('billing.renewalReminderTitle')}</p>
            <p className="mt-1 text-sm text-muted">
              {renewalDays != null && renewalDays < 0
                ? t('billing.subscriptionExpired')
                : t('billing.renewalReminderBody', { days: renewalDays })}
            </p>
          </div>
        </div>
      )}

      {/* Tier selection */}
      <section className="mb-8">
        <h2 className="mb-4 font-display text-xl font-semibold text-primary">{t('billing.choosePlan')}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {LANDLORD_TIERS.map((tier) => {
            const isSelected = selectedTier === tier.id
            return (
              <button
                key={tier.id}
                type="button"
                disabled={!BILLING_LIVE}
                onClick={() => setSelectedTier(tier.id)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-accent bg-accent/5 ring-2 ring-accent/30'
                    : 'border-border bg-surface hover:border-accent/30'
                } ${!BILLING_LIVE ? 'cursor-default opacity-90' : ''}`}
              >
                <p className="font-display font-semibold text-primary">{t(tierNameKey(tier.id))}</p>
                <p className="mt-1 font-display text-2xl font-bold text-primary">
                  {tier.price ? `P${tier.price}` : t('pricing.free')}
                  {tier.price > 0 && <span className="text-sm font-normal text-muted">{t('pricing.perMonth')}</span>}
                </p>
                {isSelected && (
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent">
                    <Check size={12} />
                    {t('billing.selected')}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {!BILLING_LIVE && (
          <p className="mt-3 text-sm text-muted">{t('billing.planSelectionSoon')}</p>
        )}
      </section>

      {/* FNB payment details */}
      <section className="mb-8">
        <h2 className="mb-4 font-display text-xl font-semibold text-primary">{t('billing.howToPay')}</h2>
        <Card className="relative overflow-hidden p-5 sm:p-6">
          {!BILLING_LIVE && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/80 backdrop-blur-[2px]">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-surface px-4 py-2 text-sm font-semibold text-accent shadow-sm">
                <Clock size={16} />
                {t('billing.paymentsComingSoon')}
              </span>
            </div>
          )}
          <ol className="space-y-4 text-sm">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                  {n}
                </span>
                <span className="text-muted">{t(`billing.payStep${n}`)}</span>
              </li>
            ))}
          </ol>
          <dl className="mt-6 space-y-2 rounded-xl border border-border bg-background p-4 text-sm">
            <div className="flex gap-2">
              <dt className="w-32 shrink-0 text-muted">{t('billing.bank')}</dt>
              <dd className="font-medium text-primary">{FNB_PAYMENT.bank}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-32 shrink-0 text-muted">{t('billing.accountName')}</dt>
              <dd className="font-medium text-primary">{FNB_PAYMENT.accountName}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-32 shrink-0 text-muted">{t('billing.accountNumber')}</dt>
              <dd className="font-mono font-medium text-primary">{FNB_PAYMENT.accountNumber}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-32 shrink-0 text-muted">{t('billing.branchCode')}</dt>
              <dd className="font-mono text-primary">{FNB_PAYMENT.branchCode}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-32 shrink-0 text-muted">{t('billing.reference')}</dt>
              <dd className="text-primary">{FNB_PAYMENT.referenceHint}</dd>
            </div>
          </dl>
        </Card>
      </section>

      {/* Receipt upload */}
      <section className="mb-8">
        <h2 className="mb-4 font-display text-xl font-semibold text-primary">{t('billing.uploadReceipt')}</h2>
        <Card className="relative p-5 sm:p-6">
          {!BILLING_LIVE && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-surface/80 backdrop-blur-[2px]">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-surface px-4 py-2 text-sm font-semibold text-accent shadow-sm">
                <Clock size={16} />
                {t('billing.uploadComingSoon')}
              </span>
            </div>
          )}
          <p className="text-sm text-muted">{t('billing.uploadReceiptHint')}</p>
          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background px-4 py-8 transition-colors hover:border-accent/40">
            <Upload size={28} className="text-muted" />
            <span className="mt-2 text-sm font-medium text-primary">{t('billing.chooseFile')}</span>
            <span className="mt-1 text-xs text-muted">PDF, JPG, PNG</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="sr-only"
              disabled={!BILLING_LIVE || uploading}
              onChange={handleReceiptUpload}
            />
          </label>
          {uploading && <p className="mt-2 text-sm text-muted">{t('billing.uploading')}</p>}
          {uploadError && <p className="mt-2 text-sm text-error">{uploadError}</p>}
          {uploadSuccess && (
            <p className="mt-2 text-sm text-success">{t('billing.uploadSuccess')}</p>
          )}
        </Card>
      </section>

      {/* Receipt history */}
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-primary">{t('billing.receiptHistory')}</h2>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : receipts.length === 0 ? (
          <Card className="p-8 text-center text-muted">{t('billing.noReceipts')}</Card>
        ) : (
          <div className="space-y-3">
            {receipts.map((r) => (
              <Card key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <FileText size={20} className="mt-0.5 shrink-0 text-accent" />
                  <div>
                    <p className="font-medium text-primary">
                      {formatTierLabel(r.tier, t)} · P{r.amount_pula ?? '—'}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                    {r.admin_notes && (
                      <p className="mt-1 text-sm text-muted">{r.admin_notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'warning'
                    }
                  >
                    {t(`billing.receiptStatus.${r.status}`)}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => openReceipt(r.storage_path)}>
                    {t('billing.viewReceipt')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 text-center">
        <Button as={Link} to="/pricing" variant="outline">
          {t('billing.comparePlans')}
          <ChevronRight size={16} />
        </Button>
      </div>
    </motion.div>
  )
}
