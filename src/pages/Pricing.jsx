import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  Sparkles,
  Clock,
  GraduationCap,
  Building2,
  ChevronRight,
  Shield,
  Zap,
  Heart,
  Banknote,
  Upload,
  BadgeCheck,
  Gift,
  ArrowRight,
} from 'lucide-react'
import Button from '../components/ui/Button'
import { Reveal } from '../components/ui/Motion'
import { useTranslation } from '../hooks/useTranslation'
import { LANDLORD_TIERS, FNB_PAYMENT, tierNameKey, BILLING_LIVE, getTierCardStyle } from '../lib/subscriptions'

const STUDENT_PERKS = ['studentPerk1', 'studentPerk2', 'studentPerk3']

const PAYMENT_STEPS = [
  { icon: Building2, key: 'stepChoose' },
  { icon: Banknote, key: 'stepPay' },
  { icon: Upload, key: 'stepUpload' },
  { icon: BadgeCheck, key: 'stepVerify' },
]

export default function Pricing() {
  const { t } = useTranslation()
  const [audience, setAudience] = useState('students')
  const [selectedTier, setSelectedTier] = useState('standard')
  const [hoveredTier, setHoveredTier] = useState(null)

  const activeTier = LANDLORD_TIERS.find((tier) => tier.id === selectedTier)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary px-4 py-10 sm:py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="hero-orb hero-orb-1 opacity-40" />
        <div className="hero-orb hero-orb-2 opacity-30" />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="section-label mb-5 text-accent">{t('pricing.label')}</span>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {t('pricing.title')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/65">{t('pricing.subtitle')}</p>

          <div className="mx-auto mt-6 flex w-full max-w-sm flex-col rounded-xl border border-white/15 bg-white/5 p-1 backdrop-blur-sm sm:mt-8 sm:inline-flex sm:w-auto sm:max-w-none sm:flex-row">
            {[
              { id: 'students', icon: GraduationCap, label: t('pricing.tabStudents') },
              { id: 'landlords', icon: Building2, label: t('pricing.tabLandlords') },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setAudience(id)}
                className={`relative flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors sm:w-auto sm:px-5 ${
                  audience === id ? 'text-primary' : 'text-white/70 hover:text-white'
                }`}
              >
                {audience === id && (
                  <motion.span
                    layoutId="pricing-audience"
                    className="absolute inset-0 rounded-lg bg-accent shadow-lg shadow-accent/25"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <Icon size={16} />
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {audience === 'students' ? (
          <motion.section
            key="students"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="border-b border-border bg-gradient-to-b from-accent/20 to-accent/5 py-8 sm:py-12 lg:py-16"
          >
            <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary shadow-md shadow-accent/30"
              >
                <Sparkles size={14} />
                {t('pricing.studentsBadge')}
              </motion.div>

              <h2 className="mt-4 font-display text-2xl font-bold text-primary sm:mt-6 sm:text-3xl lg:text-4xl">
                {t('pricing.studentsTitle')}
              </h2>
              <motion.p
                className="mx-auto mt-3 font-display text-3xl font-bold text-accent sm:mt-4 sm:text-4xl lg:text-5xl"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                {t('pricing.studentsFree')}
              </motion.p>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                {t('pricing.studentsTagline')}
              </p>

              <div className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-2 sm:mt-8 sm:gap-3">
                {STUDENT_PERKS.map((key, i) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="flex items-center gap-2 rounded-full border border-accent/30 bg-surface px-4 py-2 text-sm font-medium text-primary shadow-sm"
                  >
                    <Shield size={15} className="text-accent" />
                    {t(`pricing.${key}`)}
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 flex flex-col justify-center gap-3 sm:mt-8 sm:flex-row">
                <Button as={Link} to="/listings" variant="primary" size="lg">
                  {t('hero.browseListings')}
                </Button>
                <Button as={Link} to="/register" variant="outline" size="lg">
                  {t('auth.register')}
                </Button>
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.div
            key="landlords"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
          >
            {/* Early access callout */}
            <section className="border-b border-accent/20 bg-gradient-to-r from-accent/15 via-accent/5 to-transparent py-6 sm:py-8">
              <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-accent ring-1 ring-accent/30">
                  <Gift size={28} />
                </span>
                <div className="flex-1">
                  <p className="font-display text-xl font-bold text-primary">{t('pricing.earlyAccessTitle')}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{t('pricing.earlyAccessBody')}</p>
                </div>
                <motion.div
                  className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-surface px-4 py-2 text-sm font-semibold text-accent shadow-sm"
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  <Clock size={16} />
                  {t('pricing.comingSoon')}
                </motion.div>
              </div>
            </section>

            <section className="py-8 sm:py-12 lg:py-16">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <Reveal className="mb-8 text-center sm:mb-10">
                  <h2 className="font-display text-3xl font-semibold text-primary sm:text-4xl">
                    {t('pricing.landlordsTitle')}
                  </h2>
                  <p className="mx-auto mt-3 max-w-2xl text-muted">{t('pricing.comingSoonNote')}</p>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wider text-accent">
                    {t('pricing.selectPlan')}
                  </p>
                </Reveal>

                <div className="mx-auto grid max-w-lg gap-8 sm:max-w-none sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6">
                  {LANDLORD_TIERS.map((tier, i) => {
                    const isSelected = selectedTier === tier.id
                    const isHovered = hoveredTier === tier.id
                    const isFree = !tier.price
                    const style = getTierCardStyle(tier.id)

                    return (
                      <div
                        key={tier.id}
                        className={`relative ${tier.featured ? 'pt-4 sm:pt-5 lg:scale-[1.02] lg:transform' : 'pt-1'}`}
                      >
                        {tier.featured && (
                          <span className="absolute left-1/2 top-0 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-primary shadow-md ring-2 ring-surface sm:px-4 sm:text-xs">
                            {t('pricing.popular')}
                          </span>
                        )}

                        <motion.button
                          type="button"
                          initial={{ opacity: 0, y: 24 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          whileHover={{ y: tier.featured ? -4 : -6 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedTier(tier.id)}
                          onMouseEnter={() => setHoveredTier(tier.id)}
                          onMouseLeave={() => setHoveredTier(null)}
                          className={`relative flex h-full w-full flex-col rounded-2xl p-5 text-left transition-shadow sm:p-6 lg:p-8 ${
                            style.card
                          } ${isSelected ? style.selected : style.hover}`}
                        >
                          <span className={`absolute inset-x-0 top-0 rounded-t-2xl ${style.topBar}`} aria-hidden />

                          <div className={`mb-5 sm:mb-6 ${tier.featured ? 'mt-2' : 'mt-1'}`}>
                            <h3 className="font-display text-lg font-semibold text-primary sm:text-xl">
                              {t(tierNameKey(tier.id))}
                            </h3>
                            <div className="mt-2 flex flex-wrap items-baseline gap-x-1 gap-y-0 sm:mt-3">
                              {isFree ? (
                                <span className={`font-display text-3xl font-bold sm:text-4xl ${style.freePrice}`}>
                                  {t('pricing.free')}
                                </span>
                              ) : (
                                <>
                                  <motion.span
                                    key={`${tier.id}-${isHovered}`}
                                    className="font-display text-3xl font-bold text-primary sm:text-4xl"
                                    initial={{ scale: 0.9, opacity: 0.5 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                  >
                                    P{tier.price}
                                  </motion.span>
                                  <span className="text-sm text-muted sm:text-base">{t('pricing.perMonth')}</span>
                                </>
                              )}
                            </div>
                            {!BILLING_LIVE && (
                              <p className="mt-2 text-xs font-medium text-muted sm:text-accent/90">
                                {t('pricing.earlyAccessFreeNow')}
                              </p>
                            )}
                          </div>

                          <ul className="mb-6 flex-1 space-y-2.5 sm:mb-8 sm:space-y-3">
                            {tier.features.map((key) => (
                              <li key={key} className="flex items-start gap-2 text-sm text-primary">
                                <Check size={16} className={`mt-0.5 shrink-0 sm:h-[18px] sm:w-[18px] ${style.check}`} />
                                {t(`pricing.${key}`)}
                              </li>
                            ))}
                          </ul>

                          <span
                            className={`inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold ${
                              isSelected
                                ? style.ctaSelected
                                : 'border border-border bg-background text-muted'
                            }`}
                          >
                            {BILLING_LIVE ? t('pricing.selectThisPlan') : t('pricing.comingSoon')}
                            {isSelected && <ChevronRight size={16} />}
                          </span>
                        </motion.button>
                      </div>
                    )
                  })}
                </div>

                <AnimatePresence mode="wait">
                  {activeTier && (
                    <motion.div
                      key={activeTier.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-8 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 to-surface p-6 sm:p-8">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/20">
                            <Zap className="h-6 w-6 text-accent" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                              {t('pricing.planDetails')}
                            </p>
                            <h3 className="mt-1 font-display text-xl font-semibold text-primary">
                              {t(tierNameKey(activeTier.id))}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted">
                              {t(`pricing.${activeTier.whyKey}`)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Reveal className="mx-auto mt-8 max-w-2xl text-center">
                <p className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted">
                  {t('pricing.tierIdentityNote')}
                </p>
              </Reveal>
            </section>

            {/* How billing works — FNB manual flow */}
            <section className="border-y border-border bg-background py-10 sm:py-14">
              <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <Reveal className="text-center">
                  <span className="section-label mb-4">{t('pricing.billingFlowLabel')}</span>
                  <h2 className="font-display text-3xl font-semibold text-primary">{t('pricing.billingFlowTitle')}</h2>
                  <p className="mx-auto mt-3 max-w-2xl text-sm text-muted">{t('pricing.billingFlowSubtitle')}</p>
                </Reveal>

                <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {PAYMENT_STEPS.map(({ icon: Icon, key }, i) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className="relative rounded-2xl border border-border bg-surface p-5"
                    >
                      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                        <Icon size={20} />
                      </span>
                      <p className="text-xs font-bold uppercase tracking-wider text-accent">
                        {t('pricing.step')} {i + 1}
                      </p>
                      <p className="mt-1 font-display text-base font-semibold text-primary">
                        {t(`pricing.${key}Title`)}
                      </p>
                      <p className="mt-2 text-sm text-muted">{t(`pricing.${key}Body`)}</p>
                      {i < PAYMENT_STEPS.length - 1 && (
                        <ArrowRight
                          size={18}
                          className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-accent/40 lg:block"
                        />
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 rounded-2xl border border-dashed border-accent/40 bg-accent/5 p-6 sm:p-8">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                        {t('pricing.bankDetailsPreview')}
                      </p>
                      <p className="mt-1 text-sm text-muted">{t('pricing.bankDetailsNote')}</p>
                      <dl className="mt-4 space-y-3 text-sm sm:space-y-2">
                        {[
                          [t('billing.bank'), FNB_PAYMENT.bank],
                          [t('billing.accountName'), FNB_PAYMENT.accountName],
                          [t('billing.accountNumber'), FNB_PAYMENT.accountNumber],
                          [t('billing.reference'), FNB_PAYMENT.referenceHint],
                        ].map(([label, value]) => (
                          <div key={label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                            <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted sm:w-28 sm:text-sm sm:normal-case sm:tracking-normal">
                              {label}
                            </dt>
                            <dd className="break-words font-medium text-primary sm:font-normal">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-accent/30 bg-surface px-3 py-1.5 text-xs font-semibold text-accent">
                      <Clock size={14} />
                      {t('pricing.comingSoon')}
                    </span>
                  </div>
                </div>

                <p className="mt-8 text-center text-sm text-muted">
                  <span className="block sm:inline">{t('pricing.freeForNow')}{' '}</span>
                  <Link to="/register?role=landlord" className="font-semibold text-accent hover:underline">
                    {t('pricing.listFreeNow')}
                  </Link>
                  <span className="mx-1 hidden sm:inline">·</span>
                  <span className="block sm:inline">
                    <Link to="/landlord/billing" className="font-semibold text-accent hover:underline">
                      {t('pricing.viewBilling')}
                    </Link>
                  </span>
                </p>
              </div>
            </section>

            <section className="py-8 sm:py-12 lg:py-16">
              <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                <Reveal className="text-center">
                  <span className="section-label mb-4">{t('pricing.whyLabel')}</span>
                  <h2 className="font-display text-3xl font-semibold text-primary">{t('pricing.whyTitle')}</h2>
                </Reveal>

                <div className="mt-6 space-y-3 sm:mt-8">
                  {LANDLORD_TIERS.map((tier, i) => {
                    const isOpen = selectedTier === tier.id
                    return (
                      <motion.div
                        key={tier.id}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ delay: i * 0.06 }}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedTier(tier.id)}
                          className={`w-full rounded-xl border p-5 text-left transition-all ${
                            isOpen
                              ? 'border-accent bg-surface shadow-md'
                              : 'border-border bg-surface hover:border-accent/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <h3 className="font-display text-lg font-semibold text-primary">
                              {t(tierNameKey(tier.id))}
                            </h3>
                            <motion.span animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronRight size={20} className="text-accent" />
                            </motion.span>
                          </div>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 overflow-hidden text-sm leading-relaxed text-muted"
                              >
                                {t(`pricing.${tier.whyKey}`)}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </button>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="border-t border-border bg-primary py-6 sm:py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-4 text-center sm:flex-row sm:justify-between sm:gap-4 sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/20">
              <Heart className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-white">{t('pricing.studentsTitle')}</p>
              <p className="text-sm text-white/60">{t('pricing.studentsTagline')}</p>
            </div>
          </div>
          <Button as={Link} to="/listings" variant="accent" size="md">
            {t('hero.browseListings')}
          </Button>
        </div>
      </section>
    </motion.div>
  )
}
