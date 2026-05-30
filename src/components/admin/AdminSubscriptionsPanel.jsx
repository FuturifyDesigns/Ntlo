import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Check, X, FileText, Calendar, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import { Skeleton } from '../ui/Skeleton'
import AdminActionModal from './AdminActionModal'
import {
  fetchPendingPaymentReceipts,
  fetchLandlordSubscriptionOverview,
  getReceiptSignedUrl,
  reviewPaymentReceipt,
} from '../../lib/paymentReceipts'
import {
  formatTierLabel,
  subscriptionStatusLabel,
  daysUntilRenewal,
} from '../../lib/subscriptions'

export default function AdminSubscriptionsPanel() {
  const { t } = useTranslation()
  const [landlords, setLandlords] = useState([])
  const [pendingReceipts, setPendingReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [dialog, setDialog] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [overview, pending] = await Promise.all([
        fetchLandlordSubscriptionOverview(),
        fetchPendingPaymentReceipts(),
      ])
      setLandlords(overview)
      setPendingReceipts(pending)
    } catch {
      setLandlords([])
      setPendingReceipts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const channel = supabase
      .channel('admin-subscriptions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_receipts' }, refresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, refresh)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [refresh])

  const filteredLandlords = useMemo(() => {
    return landlords.filter((l) => {
      if (filter === 'paid') return l.subscription_status === 'active'
      if (filter === 'unpaid') return l.subscription_status !== 'active'
      if (filter === 'early_access') return l.subscription_status === 'early_access'
      if (filter === 'pending') return l.subscription_status === 'pending_payment'
      if (filter === 'expiring') {
        const days = daysUntilRenewal(l.subscription_period_end)
        return days != null && days >= 0 && days <= 7
      }
      return true
    })
  }, [landlords, filter])

  const stats = useMemo(() => ({
    total: landlords.length,
    active: landlords.filter((l) => l.subscription_status === 'active').length,
    earlyAccess: landlords.filter((l) => l.subscription_status === 'early_access').length,
    pendingReceipts: pendingReceipts.length,
  }), [landlords, pendingReceipts])

  async function openReceipt(path) {
    const url = await getReceiptSignedUrl(path)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function confirmReview(receipt, approved) {
    setDialog({
      mode: approved ? 'confirm' : 'prompt',
      title: approved ? t('admin.approveReceipt') : t('admin.rejectReceipt'),
      subtitle: receipt.landlord?.full_name,
      description: approved
        ? t('admin.approveReceiptDesc', { tier: receipt.tier, amount: receipt.amount_pula })
        : t('admin.rejectReceiptDesc'),
      noteRequired: !approved,
      confirmLabel: approved ? t('admin.approve') : t('admin.reject'),
      confirmVariant: approved ? 'primary' : 'danger',
      onConfirm: async (note) => {
        await reviewPaymentReceipt(receipt.id, approved, note)
        await refresh()
      },
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm text-muted">
        <p className="font-semibold text-primary">{t('admin.subscriptionsPreview')}</p>
        <p className="mt-1">{t('admin.subscriptionsPreviewNote')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: t('admin.statLandlordsTotal'), value: stats.total },
          { label: t('admin.statPaid'), value: stats.active },
          { label: t('admin.statEarlyAccess'), value: stats.earlyAccess },
          { label: t('admin.statPendingReceipts'), value: stats.pendingReceipts },
        ].map(({ label, value }) => (
          <Card key={label} className="p-4">
            <p className="text-xs text-muted">{label}</p>
            <p className="font-display text-2xl font-bold text-primary">{value}</p>
          </Card>
        ))}
      </div>

      {/* Pending receipts queue */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-primary">
          <CreditCard size={18} />
          {t('admin.pendingReceipts')}
          {pendingReceipts.length > 0 && (
            <Badge variant="warning">{pendingReceipts.length}</Badge>
          )}
        </h2>
        {pendingReceipts.length === 0 ? (
          <Card className="p-6 text-center text-muted">{t('admin.noPendingReceipts')}</Card>
        ) : (
          <div className="space-y-3">
            {pendingReceipts.map((r) => (
              <Card key={r.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-primary">{r.landlord?.full_name || '—'}</p>
                  <p className="text-sm text-muted">
                    {formatTierLabel(r.tier, t)} · P{r.amount_pula} · {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openReceipt(r.storage_path)}>
                    <FileText size={14} />
                    {t('admin.viewDoc')}
                  </Button>
                  <Button size="sm" onClick={() => confirmReview(r, true)}>
                    <Check size={14} />
                    {t('admin.approve')}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => confirmReview(r, false)}>
                    <X size={14} />
                    {t('admin.reject')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Landlord subscription overview */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-primary">{t('admin.landlordBilling')}</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="all">{t('admin.filterAll')}</option>
            <option value="paid">{t('admin.filterPaid')}</option>
            <option value="unpaid">{t('admin.filterUnpaid')}</option>
            <option value="early_access">{t('admin.filterEarlyAccess')}</option>
            <option value="pending">{t('admin.filterPendingPayment')}</option>
            <option value="expiring">{t('admin.filterExpiring')}</option>
          </select>
        </div>

        {filteredLandlords.length === 0 ? (
          <Card className="p-6 text-center text-muted">{t('admin.noLandlordsMatch')}</Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-surface">
                <tr>
                  <th className="px-4 py-3 font-medium text-muted">{t('admin.name')}</th>
                  <th className="px-4 py-3 font-medium text-muted">{t('admin.tier')}</th>
                  <th className="px-4 py-3 font-medium text-muted">{t('admin.billingStatus')}</th>
                  <th className="px-4 py-3 font-medium text-muted">{t('admin.renewalDate')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredLandlords.map((l) => {
                  const days = daysUntilRenewal(l.subscription_period_end)
                  const expiringSoon = days != null && days >= 0 && days <= 7
                  return (
                    <tr key={l.id} className="border-b border-border last:border-0 hover:bg-background/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-primary">{l.full_name || '—'}</p>
                        <p className="text-xs text-muted">{l.phone || '—'}</p>
                      </td>
                      <td className="px-4 py-3">{formatTierLabel(l.subscription_tier, t)}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            l.subscription_status === 'active'
                              ? 'success'
                              : l.subscription_status === 'pending_payment'
                                ? 'warning'
                                : 'default'
                          }
                        >
                          {subscriptionStatusLabel(l.subscription_status, t)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {l.subscription_period_end ? (
                          <span className={`inline-flex items-center gap-1 ${expiringSoon ? 'text-warning' : 'text-primary'}`}>
                            {expiringSoon && <AlertCircle size={14} />}
                            <Calendar size={14} className="text-muted" />
                            {new Date(l.subscription_period_end).toLocaleDateString()}
                            {days != null && days >= 0 && (
                              <span className="text-xs text-muted">({days}d)</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {dialog && (
        <AdminActionModal
          {...dialog}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}
