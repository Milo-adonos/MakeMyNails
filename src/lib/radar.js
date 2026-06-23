const PLAN_REVENUE = {
  premium: { revenue_amount: 9.99, revenue_currency: 'EUR' },
  exclusif_ia: { revenue_amount: 14.99, revenue_currency: 'EUR' },
  sub_premium: { revenue_amount: 9.99, revenue_currency: 'EUR' },
  sub_exclusif_ia: { revenue_amount: 14.99, revenue_currency: 'EUR' },
}

export function planKey(planId) {
  if (!planId) return 'premium'
  if (planId === 'exclusif_ia' || planId === 'sub_exclusif_ia') return 'exclusif_ia'
  return 'premium'
}

export function getPlanRevenue(planId) {
  return PLAN_REVENUE[planId] || PLAN_REVENUE[planKey(planId)]
}

/** @param {string} event @param {Record<string, string>} [properties] @param {{ revenue_amount?: number, revenue_currency?: string }} [opts] */
export function trackEvent(event, properties, opts) {
  try {
    if (typeof window !== 'undefined' && window.visitors?.track) {
      window.visitors.track(event, properties || {}, opts)
    }
  } catch {
    // Radar non chargé ou bloqué
  }
}
