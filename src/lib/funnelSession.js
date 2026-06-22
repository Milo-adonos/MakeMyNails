const PLAN_KEY = 'funnel_selected_plan'
const RESULT_KEY = 'funnel_pending_result'
const CHECKOUT_KEY = 'funnel_pending_checkout'

export function setSelectedPlan(planId) {
  sessionStorage.setItem(PLAN_KEY, planId)
}

export function getSelectedPlan() {
  return sessionStorage.getItem(PLAN_KEY)
}

export function clearSelectedPlan() {
  sessionStorage.removeItem(PLAN_KEY)
}

export function persistFunnelResult(result) {
  if (!result) return
  sessionStorage.setItem(RESULT_KEY, JSON.stringify(result))
}

export function getFunnelResult() {
  try {
    const raw = sessionStorage.getItem(RESULT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearFunnelResult() {
  sessionStorage.removeItem(RESULT_KEY)
}

export function setPendingCheckout() {
  sessionStorage.setItem(CHECKOUT_KEY, '1')
}

export function isPendingCheckout() {
  return sessionStorage.getItem(CHECKOUT_KEY) === '1'
}

export function clearPendingCheckout() {
  sessionStorage.removeItem(CHECKOUT_KEY)
}

export function clearFunnelSession() {
  clearSelectedPlan()
  clearFunnelResult()
  clearPendingCheckout()
}

export function getPlanLabel(planId) {
  if (planId === 'sub_exclusif_ia') return 'Exclusif IA — 14,99€/mois'
  if (planId === 'sub_premium') return 'Premium — 9,99€/mois'
  return null
}
