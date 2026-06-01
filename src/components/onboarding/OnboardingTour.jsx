import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, X, Sparkles, GraduationCap, Building2, PartyPopper,
} from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { useLocale } from '../../context/LocaleContext'
import Button from '../ui/Button'
import { completeOnboarding } from '../../lib/onboarding'

const ICONS = { GraduationCap, Building2, PartyPopper, Sparkles }

const PAD = 10
const RADIUS = 14

function useTargetRect(targetId, stepIndex, active) {
  const [rect, setRect] = useState(null)

  useEffect(() => {
    if (!active || !targetId) {
      setRect(null)
      return undefined
    }

    function measure() {
      const el = document.querySelector(`[data-onboarding="${targetId}"]`)
      if (!el) {
        setRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      setRect({
        top: r.top - PAD,
        left: r.left - PAD,
        width: r.width + PAD * 2,
        height: r.height + PAD * 2,
      })
    }

    measure()
    const t = window.setTimeout(measure, 80)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    const obs = new MutationObserver(measure)
    obs.observe(document.body, { childList: true, subtree: true, attributes: true })

    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      obs.disconnect()
    }
  }, [targetId, stepIndex, active])

  return rect
}

function Spotlight({ rect }) {
  if (!rect) return null
  const { top, left, width, height } = rect
  const maskId = `onboarding-mask-${Math.round(left)}-${Math.round(top)}`

  return (
    <svg className="pointer-events-none fixed inset-0 z-[210] h-full w-full" aria-hidden>
      <defs>
        <mask id={maskId}>
          <rect width="100%" height="100%" fill="white" />
          <rect
            x={left}
            y={top}
            width={width}
            height={height}
            rx={RADIUS}
            fill="black"
          />
        </mask>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="rgba(26, 26, 46, 0.78)"
        mask={`url(#${maskId})`}
        className="pointer-events-auto"
      />
      <rect
        x={left}
        y={top}
        width={width}
        height={height}
        rx={RADIUS}
        fill="none"
        stroke="rgba(200, 168, 75, 0.95)"
        strokeWidth="2.5"
        className="pointer-events-none"
      />
    </svg>
  )
}

function TooltipCard({
  step, stepIndex, total, rect, onBack, onNext, onSkip, forced, reduceMotion,
}) {
  const { t } = useTranslation()
  const isLast = stepIndex === total - 1
  const isFirst = stepIndex === 0
  const hasTarget = Boolean(step.target)

  let positionClass = 'fixed left-1/2 top-1/2 z-[220] w-[min(calc(100vw-2rem),24rem)] -translate-x-1/2 -translate-y-1/2'
  let style = {}

  if (hasTarget && rect) {
    const cardW = Math.min(window.innerWidth - 32, 384)
    const below = rect.top + rect.height + 16
    const above = rect.top - 16
    const preferBelow = below + 220 < window.innerHeight || above < 220

    if (preferBelow && below + 200 < window.innerHeight) {
      positionClass = 'fixed z-[220] w-[min(calc(100vw-2rem),24rem)]'
      style = {
        top: below,
        left: Math.max(16, Math.min(window.innerWidth - cardW - 16, rect.left + rect.width / 2 - cardW / 2)),
      }
    } else if (above > 200) {
      positionClass = 'fixed z-[220] w-[min(calc(100vw-2rem),24rem)]'
      style = {
        bottom: window.innerHeight - above,
        left: Math.max(16, Math.min(window.innerWidth - cardW - 16, rect.left + rect.width / 2 - cardW / 2)),
      }
    }
  }

  const motionProps = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 4 } }

  return (
    <motion.div
      key={step.id}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`onboarding-title-${step.id}`}
      className={`${positionClass} rounded-2xl border border-accent/30 bg-surface p-5 shadow-2xl`}
      style={style}
      {...motionProps}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Sparkles size={16} />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            {t('onboarding.stepOf', { current: stepIndex + 1, total })}
          </p>
        </div>
        {!forced && (
          <button
            type="button"
            onClick={onSkip}
            className="rounded-lg p-1 text-muted hover:bg-background hover:text-primary"
            aria-label={t('onboarding.close')}
          >
            <X size={18} />
          </button>
        )}
      </div>

      <h2 id={`onboarding-title-${step.id}`} className="font-display text-lg font-semibold text-primary">
        {t(step.titleKey)}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t(step.bodyKey)}</p>

      {step.action === 'click' && (
        <p className="mt-3 rounded-lg border border-accent/25 bg-accent/5 px-3 py-2 text-xs font-medium text-accent">
          {t('onboarding.tryItHint')}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!isFirst && (
          <Button size="sm" variant="outline" onClick={onBack}>
            <ArrowLeft size={14} />
            {t('onboarding.back')}
          </Button>
        )}
        <Button size="sm" className="ml-auto" onClick={onNext}>
          {isLast ? t('onboarding.finish') : t('onboarding.next')}
          {!isLast && <ArrowRight size={14} />}
        </Button>
        {forced && !isLast && (
          <button
            type="button"
            onClick={onSkip}
            className="w-full text-center text-xs font-medium text-muted hover:text-primary sm:w-auto sm:ml-2"
          >
            {t('onboarding.skipTour')}
          </button>
        )}
      </div>

      <div className="mt-4 flex justify-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === stepIndex ? 'w-5 bg-accent' : 'w-1.5 bg-border'
            }`}
          />
        ))}
      </div>
    </motion.div>
  )
}

function CenterCard({
  step, stepIndex, total, onBack, onNext, onSkip, forced, reduceMotion,
}) {
  const { t } = useTranslation()
  const Icon = ICONS[step.icon] || Sparkles
  const isLast = stepIndex === total - 1
  const isFirst = stepIndex === 0

  const motionProps = reduceMotion
    ? {}
    : { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.98 } }

  return (
    <motion.div
      key={step.id}
      role="dialog"
      aria-modal="true"
      className="fixed left-1/2 top-1/2 z-[220] w-[min(calc(100vw-2rem),26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-accent/30 bg-surface p-6 shadow-2xl sm:p-8"
      {...motionProps}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
        <Icon size={28} />
      </div>
      <p className="text-center text-xs font-semibold uppercase tracking-wider text-accent">
        {t('onboarding.stepOf', { current: stepIndex + 1, total })}
      </p>
      <h2 className="mt-2 text-center font-display text-xl font-semibold text-primary sm:text-2xl">
        {t(step.titleKey)}
      </h2>
      <p className="mt-3 text-center text-sm leading-relaxed text-muted">{t(step.bodyKey)}</p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {!isFirst && (
          <Button size="sm" variant="outline" onClick={onBack}>
            <ArrowLeft size={14} />
            {t('onboarding.back')}
          </Button>
        )}
        <Button size="sm" onClick={onNext}>
          {isLast ? t('onboarding.finish') : t('onboarding.next')}
          {!isLast && <ArrowRight size={14} />}
        </Button>
        {forced && !isLast && (
          <button
            type="button"
            onClick={onSkip}
            className="w-full text-center text-xs font-medium text-muted hover:text-primary"
          >
            {t('onboarding.skipTour')}
          </button>
        )}
      </div>

      <div className="mt-5 flex justify-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === stepIndex ? 'w-5 bg-accent' : 'w-1.5 bg-border'
            }`}
          />
        ))}
      </div>
    </motion.div>
  )
}

export default function OnboardingTour({
  steps,
  open,
  forced = false,
  onClose,
  onComplete,
  onStepEnter,
}) {
  const { prefs } = useLocale()
  const [stepIndex, setStepIndex] = useState(0)
  const completingRef = useRef(false)
  const step = steps[stepIndex]
  const rect = useTargetRect(step?.target, stepIndex, open && step?.type !== 'center')

  useEffect(() => {
    if (!open) setStepIndex(0)
  }, [open])

  useEffect(() => {
    if (!open || !step) return undefined
    onStepEnter?.(step)
    if (step.onEnter?.scrollTarget) {
      const el = document.querySelector(`[data-onboarding="${step.onEnter.scrollTarget}"]`)
      el?.scrollIntoView({ behavior: prefs.reduceMotion ? 'auto' : 'smooth', block: 'center' })
    }
  }, [open, stepIndex, step, onStepEnter, prefs.reduceMotion])

  useEffect(() => {
    if (!open || !step?.target || step.action !== 'click') return undefined
    const el = document.querySelector(`[data-onboarding="${step.target}"]`)
    if (!el) return undefined

    function onClick() {
      setStepIndex((i) => Math.min(i + 1, steps.length - 1))
    }
    el.addEventListener('click', onClick)
    return () => el.removeEventListener('click', onClick)
  }, [open, step, steps.length])

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const finish = useCallback(async (markComplete) => {
    if (completingRef.current) return
    completingRef.current = true
    try {
      if (markComplete) {
        await completeOnboarding()
        onComplete?.()
      }
      onClose?.()
    } catch {
      onClose?.()
    } finally {
      completingRef.current = false
    }
  }, [onClose, onComplete])

  const goNext = useCallback(() => {
    if (stepIndex >= steps.length - 1) {
      finish(forced)
      return
    }
    setStepIndex((i) => i + 1)
  }, [stepIndex, steps.length, finish, forced])

  const goBack = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1))
  }, [])

  const skip = useCallback(() => {
    finish(forced)
  }, [finish, forced])

  if (!open || !step) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200]" aria-live="polite">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[205] bg-primary/70 backdrop-blur-[1px]"
            aria-hidden={step.type !== 'center'}
          />
          {step.type !== 'center' && <Spotlight rect={rect} />}
          {step.type === 'center' ? (
            <CenterCard
              step={step}
              stepIndex={stepIndex}
              total={steps.length}
              onBack={goBack}
              onNext={goNext}
              onSkip={skip}
              forced={forced}
              reduceMotion={prefs.reduceMotion}
            />
          ) : (
            <TooltipCard
              step={step}
              stepIndex={stepIndex}
              total={steps.length}
              rect={rect}
              onBack={goBack}
              onNext={goNext}
              onSkip={skip}
              forced={forced}
              reduceMotion={prefs.reduceMotion}
            />
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
