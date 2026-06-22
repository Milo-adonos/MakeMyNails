const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const PACKS = [
  {
    id: 'pack_starter',
    name: 'Découverte',
    price: 4.99,
    credits: 5,
    pricePerCredit: 1.00,
    type: 'one_time',
  },
  {
    id: 'pack_regular',
    name: 'Régulière',
    price: 9.99,
    credits: 15,
    pricePerCredit: 0.67,
    popular: true,
    type: 'one_time',
  },
  {
    id: 'pack_addict',
    name: 'Addict',
    price: 19.99,
    credits: 40,
    pricePerCredit: 0.50,
    type: 'one_time',
  },
]

export const SUBSCRIPTION = {
  id: 'sub_premium',
  name: 'Premium',
  price: 9.99,
  stripePriceId: 'price_1TlDXnCyclTOEYV4DD3Qrbdt',
  credits: 50,
  pricePerCredit: 0.20,
  period: 'mois',
}

export async function createCheckoutSession(packId, accessToken) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ packId }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status} — ${JSON.stringify(data)}`)
  return data.url
}
