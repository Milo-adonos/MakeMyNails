import { trackEvent, flushRadar, planKey, getPlanRevenue } from './radar'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const SUBSCRIPTIONS = [
  {
    id: 'sub_premium',
    name: 'Premium',
    price: 9.99,
    period: 'mois',
    popular: false,
    features: [
      'Générations illimitées',
      'Sauvegarde de tes designs',
      'Upload de tes inspis',
      'Catalogue complet',
      'Support prioritaire',
    ],
  },
  {
    id: 'sub_exclusif_ia',
    name: 'Exclusif IA',
    price: 14.99,
    period: 'mois',
    popular: true,
    features: [
      'Tout le plan Premium',
      'Emma — assistante IA personnelle',
      'Recommandations par occasion',
      'Accord tenue & ongles',
      'Accès prioritaire aux nouveautés',
    ],
  },
]

/** @deprecated Use SUBSCRIPTIONS */
export const SUBSCRIPTION = SUBSCRIPTIONS[0]

export async function createCheckoutSession(planId, accessToken) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ packId: planId }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status} — ${JSON.stringify(data)}`)
  return data.url
}

/** Redirection Stripe + événement Radar unique (comptabilise les ouvertures checkout). */
export function openStripeCheckout(url, { planId, placement = 'unknown' } = {}) {
  trackEvent(
    'stripe_checkout',
    { plan: planKey(planId), placement },
    getPlanRevenue(planId),
  )
  flushRadar()
  window.location.href = url
}

export async function createPortalSession(accessToken) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/create-portal-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'apikey': SUPABASE_ANON_KEY,
    },
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`)
  return data.url
}
