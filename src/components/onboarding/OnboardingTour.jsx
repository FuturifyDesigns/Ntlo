import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, X,
} from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { useLocale } from '../../context/LocaleContext'
import { getMascotForStep } from '../../lib/mascotAssets'
import MascotImage from './MascotImage'
import Button from '../ui/Button'

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
  const mascotPose = getMascotForStep(step)

  let positionClass = 'fixed left-1/2 top-1/2 z-[220] w-[min(calc(100vw-2rem),24rem)] -translate-x-1/2 -translate-y-1/2'
  let style = {}

  if (hasTarget && rect) {
    const cardW = Math.min(window.innerWidth - 32, 384)
    const cardH = 340
    const gap = 20
    const targetCenterX = rect.left + rect.width / 2
    const clampLeft = (left) => Math.max(16, Math.min(window.innerWidth - cardW - 16, left))

    positionClass = 'fixed z-[230] w-[min(calc(100vw-2rem),24rem)]'

    const aboveTop = rect.top - gap - cardH
    if (aboveTop >= 16) {
      style = {
        top: aboveTop,
        left: clampLeft(targetCenterX - cardW / 2),
      }
    } else if (rect.left - cardW - gap >= 16) {
      style = {
        top: Math.max(16, Math.min(rect.top, window.innerHeight - cardH - 16)),
        left: rect.left - cardW - gap,
        maxWidth: Math.min(cardW, rect.left - gap - 16),
      }
    } else if (rect.left + rect.width + gap + cardW <= window.innerWidth - 16) {
      style = {
        top: Math.max(16, Math.min(rect.top, window.innerHeight - cardH - 16)),
        left: rect.left + rect.width + gap,
      }
    } else {
      const belowTop = rect.top + rect.height + gap
      style = {
        top: Math.min(belowTop, window.innerHeight - cardH - 16),
        left: clampLeft(targetCenterX - cardW / 2),
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
      <div className="mb-3 flex items-start gap-3">
        <MascotImage pose={mascotPose} size="sm" className="-mt-1 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              {t('onboarding.stepOf', { current: stepIndex + 1, total })}
            </p>
            {!forced && (
              <button
                type="button"
                onClick={onSkip}
                className="-mr-1 rounded-lg p-1 text-muted hover:bg-background hover:text-primary"
                aria-label={t('onboarding.close')}
              >
                <X size={18} />
              </button>
            )}
          </div>
          <h2 id={`onboarding-title-${step.id}`} className="mt-1 font-display text-lg font-semibold text-primary">
            {t(step.titleKey)}
          </h2>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-muted">{t(step.bodyKey)}</p>

      <p className="mt-3 rounded-lg border border-accent/25 bg-accent/5 px-3 py-2 text-xs font-medium text-accent">
        {t('onboarding.nextHint')}
      </p>

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
  const isLast = stepIndex === total - 1
  const isFirst = stepIndex === 0
  const mascotPose = getMascotForStep(step)

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
      <div className="mx-auto mb-2 flex justify-center">
        <MascotImage pose={mascotPose} size="lg" />
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
  const activeStepIdRef = useRef(null)
  const step = steps[stepIndex]
  const rect = useTargetRect(step?.target, stepIndex, open && step?.type !== 'center')

  useEffect(() => {
    if (!open) {
      setStepIndex(0)
      activeStepIdRef.current = null
    }
  }, [open])

  useEffect(() => {
    if (!open || !steps.length) return
    const activeId = activeStepIdRef.current
    if (!activeId) {
      activeStepIdRef.current = steps[0]?.id
      return
    }
    const nextIndex = steps.findIndex((s) => s.id === activeId)
    if (nextIndex >= 0 && nextIndex !== stepIndex) {
      setStepIndex(nextIndex)
    } else if (nextIndex < 0) {
      setStepIndex((i) => Math.min(i, steps.length - 1))
      activeStepIdRef.current = steps[Math.min(stepIndex, steps.length - 1)]?.id
    } else if (stepIndex >= steps.length) {
      setStepIndex(steps.length - 1)
      activeStepIdRef.current = steps[steps.length - 1]?.id
    }
  }, [steps, open, stepIndex])

  useEffect(() => {
    if (step?.id) activeStepIdRef.current = step.id
  }, [step?.id])

  useEffect(() => {
    if (!open || !step) return undefined
    onStepEnter?.(step)
    if (step.onEnter?.scrollTarget) {
      const el = document.querySelector(`[data-onboarding="${step.onEnter.scrollTarget}"]`)
      el?.scrollIntoView({ behavior: prefs.reduceMotion ? 'auto' : 'smooth', block: 'center' })
    }
  }, [open, stepIndex, step, onStepEnter, prefs.reduceMotion])

  useEffect(() => {
    if (!open || !step?.target) return undefined
    const el = document.querySelector(`[data-onboarding="${step.target}"]`)
    if (!el) return undefined

    const prev = {
      position: el.style.position,
      zIndex: el.style.zIndex,
      isolation: el.style.isolation,
    }
    el.classList.add('onboarding-spotlight-target')
    el.style.position = prev.position || 'relative'
    el.style.zIndex = '225'
    el.style.isolation = 'isolate'

    return () => {
      el.classList.remove('onboarding-spotlight-target')
      el.style.position = prev.position
      el.style.zIndex = prev.zIndex
      el.style.isolation = prev.isolation
    }
  }, [open, step?.target, stepIndex])

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const finish = useCallback(async (shouldPersist) => {
    if (completingRef.current) return
    completingRef.current = true
    try {
      if (shouldPersist) {
        await onComplete?.()
      } else {
        onClose?.()
      }
    } catch {
      onClose?.()
    } finally {
      completingRef.current = false
    }
  }, [onClose, onComplete])

  const goNext = useCallback(() => {
    if (stepIndex >= steps.length - 1) {
      finish(true)
      return
    }
    const nextIndex = stepIndex + 1
    activeStepIdRef.current = steps[nextIndex]?.id
    setStepIndex(nextIndex)
  }, [stepIndex, steps, finish, forced])

  const goBack = useCallback(() => {
    setStepIndex((i) => {
      const prevIndex = Math.max(0, i - 1)
      activeStepIdRef.current = steps[prevIndex]?.id
      return prevIndex
    })
  }, [steps])

  const skip = useCallback(() => {
    finish(forced)
  }, [finish, forced])

  if (!open || !step) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200]" aria-live="polite">
          {step.type === 'center' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[205] bg-primary/70 backdrop-blur-[1px]"
            />
          )}
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
