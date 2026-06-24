import { createCheckoutSession } from './stripe'
import { supabase } from './supabase'

const SELECTED_PLAN_KEY = 'selected_plan'
const RESULT_KEY = 'funnel_pending_result'
const STEP_KEY = 'funnel_step'
const GEN_DATA_KEY = 'funnel_pending_gen'

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

export function persistFunnelStep(step) {
  if (step) sessionStorage.setItem(STEP_KEY, step)
}

export function getFunnelStep() {
  return sessionStorage.getItem(STEP_KEY)
}

export function clearFunnelStep() {
  sessionStorage.removeItem(STEP_KEY)
}

export function persistFunnelGenData(data) {
  if (!data) return
  localStorage.setItem(GEN_DATA_KEY, JSON.stringify(data))
}

export function getFunnelGenData() {
  try {
    const raw = localStorage.getItem(GEN_DATA_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearFunnelGenData() {
  localStorage.removeItem(GEN_DATA_KEY)
}

export function clearFunnelSession() {
  clearSelectedPlan()
  clearFunnelResult()
  clearFunnelStep()
  clearFunnelGenData()
}

export function getPlanLabel(plan) {
  if (plan === 'exclusif_ia') return 'Exclusif IA — 14,99€/mois'
  if (plan === 'premium') return 'Premium — 9,99€/mois'
  return null
}

export function isSubscriptionActive(subscription) {
  if (!subscription || subscription.status !== 'active') return false
  if (!subscription.current_period_end) return true
  return new Date(subscription.current_period_end) > new Date()
}

export async function waitForActiveSubscription(userId, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (isSubscriptionActive(data)) return data
    await new Promise((r) => setTimeout(r, 1500))
  }
  return null
}

export async function startStripeCheckoutFromSelectedPlan() {
  const stripePlanId = getSelectedPlanStripeId()
  if (!stripePlanId) throw new Error('Aucun plan sélectionné')

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Non authentifiée')

  const url = await createCheckoutSession(stripePlanId, session.access_token)
  window.location.href = url
}

export function mapVisualizationToResult(viz) {
  if (!viz) return null
  return {
    id: viz.id,
    originalImage: viz.original_image_url,
    resultImage: viz.result_image_url,
    shape: viz.shape,
    style: viz.style,
    length: viz.length,
    createdAt: viz.created_at,
  }
}
