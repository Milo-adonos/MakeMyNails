import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
}

const PLAN_PRICES: Record<string, number> = {
  premium: 9.99,
  exclusif_ia: 14.99,
  sub_premium: 9.99,
  sub_exclusif_ia: 14.99,
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function getSetting(supabase: ReturnType<typeof createClient>, key: string) {
  const { data } = await supabase.from('admin_settings').select('value').eq('key', key).maybeSingle()
  return data?.value
}

async function setSetting(supabase: ReturnType<typeof createClient>, key: string, value: unknown) {
  await supabase.from('admin_settings').upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
  })
}

async function verifyPassword(supabase: ReturnType<typeof createClient>, password: string): Promise<boolean> {
  const salt = await getSetting(supabase, 'admin_password_salt') as string
  const hash = await getSetting(supabase, 'admin_password_hash') as string
  if (!salt || !hash) return false
  const attempt = await sha256(`${password}${salt}`)
  return attempt === hash
}

async function signToken(payload: Record<string, unknown>): Promise<string> {
  const secret = Deno.env.get('ADMIN_SESSION_SECRET') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const body = btoa(JSON.stringify(payload))
  const sig = await sha256(`${body}.${secret}`)
  return `${body}.${sig}`
}

async function verifyToken(token: string): Promise<boolean> {
  const secret = Deno.env.get('ADMIN_SESSION_SECRET') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const [body, sig] = token.split('.')
  if (!body || !sig) return false
  const expected = await sha256(`${body}.${secret}`)
  if (sig !== expected) return false
  try {
    const payload = JSON.parse(atob(body))
    return payload.exp > Date.now()
  } catch {
    return false
  }
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

async function fetchOverview(supabase: ReturnType<typeof createClient>) {
  const now = new Date()
  const d30 = daysAgo(30)
  const d60 = daysAgo(60)

  const churnReset = await getSetting(supabase, 'churn_reset_at')
  const churnSince = churnReset && churnReset !== 'null' ? String(churnReset) : d30

  const [{ data: payments30 }, { data: paymentsPrev }, { data: gens30 }, { data: gensDaily }, { data: activeSubs }, { data: allSubs }, { data: newSubs30 }, { data: newSubsPrev }, { data: cancellations }, { data: adminCancels }] = await Promise.all([
    supabase.from('payment_events').select('amount_eur, created_at').gte('created_at', d30),
    supabase.from('payment_events').select('amount_eur').gte('created_at', d60).lt('created_at', d30),
    supabase.from('generation_logs').select('estimated_cost_eur, created_at').gte('created_at', d30),
    supabase.from('generation_logs').select('created_at').gte('created_at', d30),
    supabase.from('subscriptions').select('id').eq('status', 'active'),
    supabase.from('subscriptions').select('id, status'),
    supabase.from('subscriptions').select('id').gte('created_at', d30),
    supabase.from('subscriptions').select('id').gte('created_at', d60).lt('created_at', d30),
    supabase.from('subscription_cancellations').select('id, excluded_from_churn').gte('canceled_at', churnSince),
    supabase.from('subscription_cancellations').select('id').gte('canceled_at', churnSince).eq('excluded_from_churn', true),
  ])

  const revenue30 = (payments30 || []).reduce((s, p) => s + Number(p.amount_eur), 0)
  const revenuePrev = (paymentsPrev || []).reduce((s, p) => s + Number(p.amount_eur), 0)
  const aiCost30 = (gens30 || []).reduce((s, g) => s + Number(g.estimated_cost_eur), 0)
  const netProfit = revenue30 - aiCost30
  const marginPct = revenue30 > 0 ? (netProfit / revenue30) * 100 : 0

  const churnCount = (cancellations || []).filter((c) => !c.excluded_from_churn).length
  const activeCount = activeSubs?.length || 0
  const churnPct = activeCount + churnCount > 0 ? (churnCount / (activeCount + churnCount)) * 100 : 0

  const revenueByDay: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    revenueByDay[d.toISOString().slice(0, 10)] = 0
  }
  for (const p of payments30 || []) {
    const day = p.created_at.slice(0, 10)
    if (revenueByDay[day] !== undefined) revenueByDay[day] += Number(p.amount_eur)
  }

  const gensByDay: Record<string, number> = { ...revenueByDay }
  Object.keys(gensByDay).forEach((k) => { gensByDay[k] = 0 })
  for (const g of gensDaily || []) {
    const day = g.created_at.slice(0, 10)
    if (gensByDay[day] !== undefined) gensByDay[day] += 1
  }

  return {
    revenue30,
    revenuePrev,
    aiCost30,
    netProfit,
    marginPct,
    activeSubscribers: activeCount,
    totalSubscribers: allSubs?.length || 0,
    newSubs30: newSubs30?.length || 0,
    newSubsPrev: newSubsPrev?.length || 0,
    churnPct,
    churnCount,
    adminCancelCount: adminCancels?.length || 0,
    revenueChart: Object.entries(revenueByDay).map(([date, value]) => ({ date, value })),
    generationsChart: Object.entries(gensByDay).map(([date, value]) => ({ date, value })),
  }
}

async function fetchUsers(supabase: ReturnType<typeof createClient>, params: { plan?: string; status?: string; search?: string }) {
  const { data: hidden } = await supabase.from('admin_hidden_users').select('user_id')
  const hiddenIds = new Set((hidden || []).map((h) => h.user_id))

  const { data: profiles } = await supabase.from('profiles').select('id, email, created_at').order('created_at', { ascending: false })
  const { data: subs } = await supabase.from('subscriptions').select('*')
  const { data: gens } = await supabase.from('generation_logs').select('user_id, estimated_cost_eur')
  const { data: payments } = await supabase.from('payment_events').select('user_id, amount_eur')

  const subMap = new Map((subs || []).map((s) => [s.user_id, s]))
  const genMap = new Map<string, { count: number; cost: number }>()
  for (const g of gens || []) {
    if (!g.user_id) continue
    const cur = genMap.get(g.user_id) || { count: 0, cost: 0 }
    cur.count += 1
    cur.cost += Number(g.estimated_cost_eur)
    genMap.set(g.user_id, cur)
  }
  const payMap = new Map<string, number>()
  for (const p of payments || []) {
    if (!p.user_id) continue
    payMap.set(p.user_id, (payMap.get(p.user_id) || 0) + Number(p.amount_eur))
  }

  let users = (profiles || []).filter((p) => !hiddenIds.has(p.id)).map((p) => {
    const sub = subMap.get(p.id)
    const gen = genMap.get(p.id) || { count: 0, cost: 0 }
    const revenue = payMap.get(p.id) || 0
    return {
      id: p.id,
      email: p.email,
      plan: sub?.plan === 'exclusif_ia' ? 'Exclusif IA' : sub ? 'Premium' : '—',
      planKey: sub?.plan || null,
      status: sub?.status === 'active' ? 'actif' : sub?.status === 'canceled' ? 'annulé' : '—',
      statusKey: sub?.status || null,
      registeredAt: p.created_at,
      generations: gen.count,
      aiCost: gen.cost,
      revenue,
      net: revenue - gen.cost,
    }
  })

  if (params.plan && params.plan !== 'all') {
    const key = params.plan === 'exclusif_ia' ? 'Exclusif IA' : 'Premium'
    users = users.filter((u) => u.plan === key)
  }
  if (params.status && params.status !== 'all') {
    users = users.filter((u) => u.statusKey === params.status)
  }
  if (params.search) {
    const q = params.search.toLowerCase()
    users = users.filter((u) => u.email?.toLowerCase().includes(q))
  }

  return users
}

async function fetchAnalytics(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase
    .from('generation_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)
  return data || []
}

async function fetchFinances(supabase: ReturnType<typeof createClient>) {
  const d30 = daysAgo(30)
  const d7 = daysAgo(7)

  const [{ data: p30 }, { data: p7 }, { data: allPayments }, { data: gens }] = await Promise.all([
    supabase.from('payment_events').select('*').gte('created_at', d30).order('created_at', { ascending: false }),
    supabase.from('payment_events').select('amount_eur').gte('created_at', d7),
    supabase.from('payment_events').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('generation_logs').select('estimated_cost_eur, created_at').gte('created_at', d30),
  ])

  const revenue30 = (p30 || []).reduce((s, p) => s + Number(p.amount_eur), 0)
  const revenue7 = (p7 || []).reduce((s, p) => s + Number(p.amount_eur), 0)
  const aiCost30 = (gens || []).reduce((s, g) => s + Number(g.estimated_cost_eur), 0)

  return {
    revenue30,
    revenue7,
    aiCost30,
    net30: revenue30 - aiCost30,
    payments: allPayments || [],
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const body = req.method === 'POST' ? await req.json() : {}
    const action = body.action || new URL(req.url).searchParams.get('action')

    if (action === 'maintenance_check') {
      const mode = await getSetting(supabase, 'maintenance_mode')
      return json({ maintenanceMode: mode === true || mode === 'true' })
    }

    if (action === 'login') {
      const ok = await verifyPassword(supabase, body.password || '')
      if (!ok) return json({ error: 'Mot de passe incorrect' }, 401)
      const token = await signToken({ exp: Date.now() + 12 * 60 * 60 * 1000, iat: Date.now() })
      return json({ token })
    }

    const adminToken = req.headers.get('x-admin-token') || body.token
    if (!adminToken || !(await verifyToken(adminToken))) {
      return json({ error: 'Non autorisé' }, 401)
    }

    const updatedAt = new Date().toISOString()

    if (action === 'overview') {
      return json({ ...await fetchOverview(supabase), updatedAt })
    }

    if (action === 'users') {
      return json({ users: await fetchUsers(supabase, body), updatedAt })
    }

    if (action === 'analytics') {
      return json({ logs: await fetchAnalytics(supabase), updatedAt })
    }

    if (action === 'finances') {
      return json({ ...(await fetchFinances(supabase)), updatedAt })
    }

    if (action === 'settings_get') {
      const keys = ['generation_cost_eur', 'admin_notification_email', 'maintenance_mode', 'churn_reset_at']
      const settings: Record<string, unknown> = {}
      for (const k of keys) settings[k] = await getSetting(supabase, k)
      const { count } = await supabase
        .from('subscription_cancellations')
        .select('id', { count: 'exact', head: true })
        .eq('excluded_from_churn', false)
      return json({ settings, cancellationCount: count || 0, updatedAt })
    }

    if (action === 'settings_update') {
      const { generationCostEur, notificationEmail, maintenanceMode, newPassword } = body
      if (generationCostEur !== undefined) await setSetting(supabase, 'generation_cost_eur', Number(generationCostEur))
      if (notificationEmail !== undefined) await setSetting(supabase, 'admin_notification_email', notificationEmail)
      if (maintenanceMode !== undefined) await setSetting(supabase, 'maintenance_mode', !!maintenanceMode)
      if (newPassword) {
        const salt = await getSetting(supabase, 'admin_password_salt') as string
        const hash = await sha256(`${newPassword}${salt}`)
        await setSetting(supabase, 'admin_password_hash', hash)
      }
      return json({ ok: true, updatedAt })
    }

    if (action === 'hide_user') {
      await supabase.from('admin_hidden_users').upsert({ user_id: body.userId })
      return json({ ok: true })
    }

    if (action === 'reset_churn') {
      await setSetting(supabase, 'churn_reset_at', new Date().toISOString())
      return json({ ok: true, updatedAt: new Date().toISOString() })
    }

    if (action === 'cancel_subscription') {
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-04-10' })
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', body.userId)
        .eq('status', 'active')
        .maybeSingle()
      if (!sub?.stripe_subscription_id) return json({ error: 'Aucun abonnement actif' }, 400)

      await stripe.subscriptions.cancel(sub.stripe_subscription_id)
      await supabase.from('subscriptions').update({ status: 'canceled' }).eq('id', sub.id)
      await supabase.from('subscription_cancellations').insert({
        user_id: body.userId,
        excluded_from_churn: true,
        canceled_by: 'admin',
      })
      return json({ ok: true })
    }

    return json({ error: 'Action inconnue' }, 400)
  } catch (err) {
    console.error('admin error:', err)
    return json({ error: err.message }, 500)
  }
})
