import { Link } from 'react-router-dom'
import { Clock, Check } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { BILLING_LIVE } from '../../lib/subscriptions'
import { LANDLORD_TIER_BENEFITS, TIER_BENEFIT_ORDER } from '../../lib/tierBenefits'
import TrustedBadge from '../trust/TrustedBadge'
import Button from '../ui/Button'

/** Subscription tier comparison — for Pricing / Billing preview only (not identity verification). */
export default function LandlordTierBenefits({ compact = false }) {
  const { t } = useTranslation()

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      {!BILLING_LIVE && (
        <div className="flex flex-wrap items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-surface px-3 py-1 text-xs font-semibold text-accent">
            <Clock size={14} />
            {t('pricing.comingSoon')}
          </span>
          <p className="min-w-0 flex-1 text-sm text-muted">{t('pricing.tierPreviewNote')}</p>
        </div>
      )}

      <div>
        <p className="font-semibold text-primary">{t('pricing.tierBenefitsTitle')}</p>
        <p className="mt-1 text-sm text-muted">{t('pricing.tierBenefitsSubtitle')}</p>
      </div>

      <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'sm:grid-cols-3'}`}>
        {TIER_BENEFIT_ORDER.map((tierId) => {
          const tier = LANDLORD_TIER_BENEFITS[tierId]
          const isPaid = tier.price > 0
          return (
            <div
              key={tierId}
              className={`rounded-xl border p-4 ${
                tierId === 'standard'
                  ? 'border-accent/40 bg-accent/5'
                  : 'border-border bg-surface'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display font-semibold text-primary">
                  {t(`pricing.tier${tierId.charAt(0).toUpperCase() + tierId.slice(1)}Name`)}
                </h3>
                <TrustedBadge level={tier.trustBadge} compact showLabel={false} />
              </div>
              <p className="mt-1 text-sm font-mono font-bold text-primary">
                {isPaid ? `P${tier.price}${t('pricing.perMonth')}` : t('pricing.free')}
              </p>
              <ul className="mt-3 space-y-1.5">
                {tier.featureKeys.slice(0, compact ? 4 : tier.featureKeys.length).map((key) => (
                  <li key={key} className="flex items-start gap-2 text-xs text-muted">
                    <Check size={14} className="mt-0.5 shrink-0 text-accent" />
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {!compact && (
        <p className="text-xs text-muted">{t('pricing.tierIdentityNote')}</p>
      )}

      {!compact && (
        <Button as={Link} to="/pricing" variant="outline" size="sm">
          {t('pricing.viewPlans')}
        </Button>
      )}
    </div>
  )
}
