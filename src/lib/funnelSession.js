import { createCheckoutSession, openStripeCheckout } from './stripe'
import { supabase } from './supabase'
import i18n from '../i18n'
import {
  persistFunnelGenData as persistGenData,
  getFunnelGenData as readGenData,
  clearFunnelGenData as removeGenData,
} from './funnelGenStorage'

const SELECTED_PLAN_KEY = 'selected_plan'
const RESULT_KEY = 'funnel_pending_result'
const STEP_KEY = 'funnel_step'

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

export async function persistFunnelGenData(data) {
  return persistGenData(data)
}

export async function getFunnelGenData() {
  return readGenData()
}

export async function clearFunnelGenData() {
  return removeGenData()
}

export function clearFunnelSession() {
  clearSelectedPlan()
  clearFunnelResult()
  clearFunnelStep()
  void clearFunnelGenData()
}

export function getPlanLabel(plan) {
  if (plan === 'exclusif_ia') return i18n.t('funnel.signup.planExclusif')
  if (plan === 'premium') return i18n.t('funnel.signup.planPremium')
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

export async function waitForAuthSession(maxAttempts = 24, intervalMs = 250) {
  for (let i = 0; i < maxAttempts; i++) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) return session
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  return null
}

export async function startStripeCheckoutFromSelectedPlan() {
  const stripePlanId = getSelectedPlanStripeId()
  if (!stripePlanId) throw new Error(i18n.t('funnel.checkout.noPlanSelected'))

  const session = await waitForAuthSession()
  if (!session?.access_token) {
    throw new Error(i18n.t('funnel.checkout.loginRequired'))
  }

  const url = await createCheckoutSession(stripePlanId, session.access_token)
  openStripeCheckout(url, { planId: stripePlanId, placement: 'funnel' })
}

export function mapVisualizationToResult(viz) {
  if (!viz) return null
  return {
    id: viz.id,
    original_image_url: viz.original_image_url,
    originalImage: viz.original_image_url,
    resultImage: viz.result_image_url,
    result_image_url: viz.result_image_url,
    shape: viz.shape,
    style: viz.style,
    length: viz.length,
    createdAt: viz.created_at,
    created_at: viz.created_at,
    status: viz.status,
  }
}
