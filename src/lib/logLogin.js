const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export async function logUserLogin(accessToken) {
  if (!accessToken) return
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/log-login`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
    })
  } catch {
    // non-blocking
  }
}
