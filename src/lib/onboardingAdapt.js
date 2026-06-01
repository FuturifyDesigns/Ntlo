/** Resolve onboarding steps from live page state (empty vs populated, loading, etc.). */

function pickVariant(step, state) {
  if (!step.variants?.length) return null
  return step.variants.find((v) => (v.when ? v.when(state) : true)) || null
}

export function resolveStepCopy(step, state) {
  const variant = pickVariant(step, state)
  if (!variant) return step
  return {
    ...step,
    titleKey: variant.titleKey || step.titleKey,
    bodyKey: variant.bodyKey || step.bodyKey,
    target: variant.target !== undefined ? variant.target : step.target,
    type: variant.type !== undefined ? variant.type : step.type,
    icon: variant.icon !== undefined ? variant.icon : step.icon,
  }
}

export function resolveOnboardingSteps(baseSteps, state = {}, options = {}) {
  if (!baseSteps?.length) return []
  if (!options.ignoreReady && state.ready === false) return []

  return baseSteps
    .filter((step) => (step.when ? step.when(state) : true))
    .map((step) => resolveStepCopy(step, state))
}

/** Merge partial state updates from nested components (e.g. housing panel). */
export function mergePageState(prev = {}, next = {}) {
  return { ...prev, ...next }
}
