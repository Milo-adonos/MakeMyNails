import { createCheckoutSession } from './stripe'
import { supabase } from './supabase'

const SELECTED_PLAN_KEY = 'selected_plan'
const RESULT_KEY = 'funnel_pending_result'

export function setSelectedPlan(planId) {
  const value = planId === 'sub_exclusif_ia' ? 'exclusif_ia' : 'premium'
  localStorage.setItem(SELECTED_PLAN_KEY, value)
}

export function getSelectedPlan() {
  const plan = localStorage.getItem(SELECTED_PLAN_KEY)
  if (plan === 'premium' || plan === 'exclusif_ia') return plan
  return null
}

export function getSelectedPlanStripeId() {
  const plan = getSelectedPlan()
  if (plan === 'exclusif_ia') return 'sub_exclusif_ia'
  if (plan === 'premium') return 'sub_premium'
  return null
}

export function clearSelectedPlan() {
  localStorage.removeItem(SELECTED_PLAN_KEY)
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

export function clearFunnelSession() {
  clearSelectedPlan()
  clearFunnelResult()
}

export function getPlanLabel(plan) {
  if (plan === 'exclusif_ia') return 'Exclusif IA — 14,99€/mois'
  if (plan === 'premium') return 'Premium — 9,99€/mois'
  return null
}

export async function startStripeCheckoutFromSelectedPlan() {
  const stripePlanId = getSelectedPlanStripeId()
  if (!stripePlanId) throw new Error('Aucun plan sélectionné')

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Non authentifiée')

  const url = await createCheckoutSession(stripePlanId, session.access_token)
  clearSelectedPlan()
  window.location.href = url
}
