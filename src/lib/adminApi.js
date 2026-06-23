const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const TOKEN_KEY = 'mmn_admin_token'

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAdminToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function adminCall(action, body = {}) {
  const token = getAdminToken()
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
      ...(token ? { 'x-admin-token': token } : {}),
    },
    body: JSON.stringify({ action, ...body }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur admin')
  return data
}

export const adminApi = {
  login: (password) => adminCall('login', { password }),
  overview: () => adminCall('overview'),
  users: (filters) => adminCall('users', filters),
  analytics: () => adminCall('analytics'),
  finances: () => adminCall('finances'),
  getSettings: () => adminCall('settings_get'),
  updateSettings: (settings) => adminCall('settings_update', settings),
  hideUser: (userId) => adminCall('hide_user', { userId }),
  resetChurn: () => adminCall('reset_churn'),
  resetStats: () => adminCall('reset_stats'),
  cancelSubscription: (userId) => adminCall('cancel_subscription', { userId }),
  checkMaintenance: () => adminCall('maintenance_check'),
}
